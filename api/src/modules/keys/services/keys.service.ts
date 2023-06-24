import { Injectable } from '@nestjs/common';

import { map } from 'lodash';
import { Types } from 'mongoose';
import { ICreateKey } from '../interfaces';
import { InjectQueue } from '@nestjs/bull';
import { RedisProcessorsKeysEnum, RedisQueueEnum } from 'src/redis-queues';
import { Queue } from 'bull';
import { KeysRepository } from '../repositories';
import { MockGenerator } from '../utils';
import { AverageService } from 'src/modules/average';

@Injectable()
export class KeysService {
  constructor(
    @InjectQueue(RedisQueueEnum.KEYS_QUEUE) private readonly keysQueue: Queue,
    private readonly keysRepository: KeysRepository,
    private readonly mockGenerator: MockGenerator,
    private readonly averageService: AverageService,
  ) { }

  async find(data: { userId: number; cityId: string }) {
    return await this.keysRepository.find(data);
  }

  async findByKey(user: string, key: string) {
    return await this.keysRepository.findByName(user, key);
  }

  async create(data: ICreateKey, article: string) {
    const keyJob = await this.keysQueue.add(
      RedisProcessorsKeysEnum.CREATE_KEY,
      { data, article },
    );

    const pvz = await keyJob.finished();

    const newKey = await this.keysRepository.create({
      article: pvz.article,
      key: pvz.key,
      userId: pvz.userId,
      pwz: pvz.pwz,
      city_id: pvz.city_id,
      average: [pvz.average],
    });

    return newKey._id;
  }

  async findById(ids: Types.ObjectId[], periods: string[]) {
    const keysIterator = map(ids, async (id: Types.ObjectId) => {
      const key = await this.keysRepository.findById(id);
      const keyGenerator = await this.mockGenerator.keyGenerator(key, periods);
      return keyGenerator;
    });

    const resolved = await Promise.all(keysIterator);
    return resolved;
  }

  async update(search, keyId) {
    const updateData = await this.keysQueue.add(
      RedisProcessorsKeysEnum.UPDATE_KEYS,
      search,
    );
    const average = await updateData.finished();
    await this.keysRepository.updateAverage(keyId, average);
  }

  async updateFromProfile(id, pwz) {
    const pvzUpdate = await this.keysRepository.updateAndPush(id, pwz);
    const find = await this.keysRepository.findById(id);
    const average = find.pwz.reduce((_accumulator, current: any) => {
      return _accumulator + Number(current.position.at(-1).position);
    }, 0);

    const newAverage = Number.isNaN(average)
      ? '2100+'
      : String(average / find.pwz.length);
    await this.averageService.update(find.pwz.at(-1)._id, newAverage);
    return pvzUpdate;
  }

  async pvzUpdate(id, pwz) {
    await this.keysRepository.update(id, pwz);
  }
}
