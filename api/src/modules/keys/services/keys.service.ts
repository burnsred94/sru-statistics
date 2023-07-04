import { Injectable } from '@nestjs/common';

import { map } from 'lodash';
import { Types } from 'mongoose';
import { KeysRepository } from '../repositories';
import { MockGenerator } from '../utils';
import { AverageService } from 'src/modules/average';
import { IKey } from 'src/interfaces';
import { PvzService } from 'src/modules/pvz';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { EventsAverage, EventsWS } from 'src/modules/article/events';

@Injectable()
export class KeysService {
  constructor(
    private readonly keysRepository: KeysRepository,
    private readonly pvzService: PvzService,
    private readonly mockGenerator: MockGenerator,
    private readonly averageService: AverageService,
    private readonly eventEmitter: EventEmitter2
  ) { }

  async create(data: IKey) {
    const keys = map(data.keys, async key => {
      const average = await this.averageService.create({
        average: 'Ожидается',
      });

      const newKey = await this.keysRepository.create({
        article: data.article,
        key: key,
        userId: data.userId,
        countPvz: 0,
        average: [average._id],
      });

      const pvz = map(data.pvz, async pvz => {
        return await this.pvzService.create(pvz, data.article, data.userId, String(newKey));
      });

      const resolved = await Promise.all(pvz);

      await this.keysRepository.update(newKey, resolved);

      return newKey._id;
    });


    const resolvedKeys = await Promise.all(keys);

    return resolvedKeys;
  }

  @OnEvent(EventsAverage.UPDATE_AVERAGE)
  async updateAverage(payload: { average: number, key_id: string }) {
    const id = payload.key_id as unknown as Types.ObjectId
    const key = await this.keysRepository.findById(id, 'all');
    await this.averageService.update(key.average.at(-1)._id, String(payload.average));
    console.log(key)

    this.eventEmitter.emit(EventsWS.CREATE_ARTICLE, { userId: key.userId });
  }

  async findById(
    ids: Array<{ _id: Types.ObjectId; active: boolean }>,
    periods: string[],
    searchObject: string,
  ) {
    const keysIterator = map(ids, async item => {
      const key = await this.keysRepository.findById(item._id, searchObject);
      const keyGenerator = await this.mockGenerator.keyGenerator(key, periods);
      return keyGenerator;
    });

    const resolved = await Promise.all(keysIterator);
    return resolved;
  }

  async removeKey(id: Types.ObjectId) {
    return await this.keysRepository.removeKey(id);
  }
}
