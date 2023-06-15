import { Injectable } from '@nestjs/common';

import { forEach, map } from 'lodash';
import { Types } from 'mongoose';
import { ICreateKey } from '../interfaces';
import { InjectQueue } from '@nestjs/bull';
import { RedisProcessorsKeysEnum, RedisQueueEnum } from 'src/redis-queues';
import { Queue } from 'bull';
import { KeysRepository } from '../repositories';
import { MockGenerator } from '../utils';

@Injectable()
export class KeysService {
  constructor(
    @InjectQueue(RedisQueueEnum.KEYS_QUEUE) private readonly keysQueue: Queue,
    private readonly keysRepository: KeysRepository,
    private readonly mockGenerator: MockGenerator,
  ) { }

  async create(data: ICreateKey) {
    const keyJob = await this.keysQueue.add(
      RedisProcessorsKeysEnum.CREATE_KEY,
      data,
    );

    const pvz = await keyJob.finished();

    const newKey = await this.keysRepository.create({
      article: pvz.articleId,
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
    const updateData = await this.keysQueue.add(RedisProcessorsKeysEnum.UPDATE_KEYS, search);
    const average = await updateData.finished();
    await this.keysRepository.updateAverage(keyId, average);
  }
}
