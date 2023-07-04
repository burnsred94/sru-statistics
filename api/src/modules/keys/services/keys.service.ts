import { Injectable } from '@nestjs/common';

import { map } from 'lodash';
import { Types } from 'mongoose';
import { KeysRepository } from '../repositories';
import { MockGenerator } from '../utils';
import { AverageService } from 'src/modules/average';
import { IKey } from 'src/interfaces';
import { PvzService } from 'src/modules/pvz';

@Injectable()
export class KeysService {
  constructor(
    private readonly keysRepository: KeysRepository,
    private readonly pvzService: PvzService,
    private readonly mockGenerator: MockGenerator,
    private readonly averageService: AverageService,
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
        return await this.pvzService.create(pvz, data.article, data.userId, newKey);
      });

      const resolved = await Promise.all(pvz);

      await this.keysRepository.update(newKey, resolved);

      return newKey._id;
    });


    const resolvedKeys = await Promise.all(keys);

    return resolvedKeys;
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
