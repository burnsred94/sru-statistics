import { Injectable, Logger } from '@nestjs/common';

import { forEach, map } from 'lodash';
import { Types } from 'mongoose';
import { KeysRepository } from '../repositories';
import { AverageService } from 'src/modules/average';
import { IKey } from 'src/interfaces';
import { PvzService } from 'src/modules/pvz';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class KeysService {
  protected readonly logger = new Logger(KeysService.name);

  constructor(
    private readonly keysRepository: KeysRepository,
    private readonly pvzService: PvzService,
    private readonly eventEmitter: EventEmitter2,
    private readonly averageService: AverageService,
  ) { }

  async create(data: IKey) {
    const { keys } = data;

    const result = [];
    let iterator = 0;
    while (keys.length > iterator) {

      const average = await this.averageService.create({
        average: 'Ожидается',
        difference: '0',
      });

      const key = await this.keysRepository.create({
        article: data.article,
        key: keys[iterator],
        userId: data.userId,
        countPvz: 0,
        average: [average._id],
      });

      result.push(key)

      new Promise((resolve) => {
        setImmediate(() => {
          resolve(map(data.pvz, pvz => {
            return this.pvzService.create(pvz, data.article, data.userId, String(key));
          }))
        })
      }).then(async (result: Types.ObjectId[]) => {
        result = await Promise.all(result);
        this.keysRepository.update(key, result);
      })

      iterator++;
    }

    return result;

  }

  async findAll() {
    return await this.keysRepository.findToUpdateED();
  }

  async findKeysByUser(userId: string) {
    return await this.keysRepository.findKeysByUser(userId);
  }

  async findAndNewPeriod() {
    await this.pvzService.findAndCreate();
  }

  @OnEvent('update.average')
  async addedNewAverage() {
    const keys = await this.keysRepository.findToUpdateED();

    forEach(keys, async key => {
      const average = await this.averageService.create({
        average: 'Ожидается',
        difference: '0',
      });
      await this.keysRepository.updateAverage(key._id, average._id);
    });
    this.logger.verbose(`Update completed average keys: ${keys.length}`);
  }

  async updateAverage(payload: { average: string; key_id: string }) {
    const id = payload.key_id as unknown as Types.ObjectId;
    const key = await this.keysRepository.findById(id, 'all');

    await this.averageService.update(key.average.at(-1)._id, payload.average, key);
  }

  async findById(ids: Array<{ _id: Types.ObjectId; active: boolean }>, searchObject: string) {
    const keysIterator = map(ids, async item => {
      const key = await this.keysRepository.findById(item._id, searchObject);
      return key;
    });

    const resolved = await Promise.all(keysIterator);
    return resolved;
  }

  async findKey(id: string) {
    return await this.keysRepository.findKey(id);
  }

  async removeKey(id: Types.ObjectId) {
    return await this.keysRepository.setStatusKey(id, false);
  }

  async activateKey(ids: Types.ObjectId[]) {
    forEach(ids, async (id: Types.ObjectId) => {
      console.log(id, `activate`)
      await this.keysRepository.setStatusKey(id, true);
    })
  }
}
