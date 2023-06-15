import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { AverageEntity, AverageService } from 'src/modules/average';
import { PvzService } from 'src/modules/pvz';
import { RedisProcessorsKeysEnum, RedisQueueEnum } from 'src/redis-queues';
import { KeysRepository } from '../repositories';
import { forEach, map, some } from 'lodash';
import { Types } from 'mongoose';

interface IAverage {
  _id: Types.ObjectId;
  timestamp: string;
  average: number;
}

@Processor({
  name: RedisQueueEnum.KEYS_QUEUE,
})
export class KeysProcessor {
  constructor(
    private readonly pvzService: PvzService,
    private readonly averageService: AverageService,
  ) { }

  @Process({
    name: RedisProcessorsKeysEnum.CREATE_KEY,
    concurrency: 1000,
  })
  async createKey(job: Job) {
    const { data, articleId, key, userId, city_id } = job.data;

    const resultAverage = [];
    const resultId = [];
    let iterator = 0;
    while (data.length > iterator) {
      const pvz = await this.pvzService.create(
        data[iterator],
        articleId,
        userId,
      );
      resultAverage.push(pvz);
      resultId.push(pvz._id);
      iterator += 1;
    }

    const reduce = resultAverage.reduce((previous, current) => {
      if (current.position[0].position.length < 5) {
        return previous + Number(current.position[0].position);
      }
      return 0;
    }, 0);

    const average = await this.averageService.create({
      average:
        reduce === 0 ? '0' : String(Math.round(reduce / resultAverage.length)),
    });

    return {
      article: articleId,
      key: key,
      userId: userId,
      pwz: resultId,
      city_id: city_id,
      average: average._id,
    };
  }

  @Process({
    name: RedisProcessorsKeysEnum.UPDATE_KEYS,
    concurrency: 1000,
  })
  async keyUpdate(job: Job) {
    const result = job.data;
    let iterator = 0;

    const resultAverage = [];
    while (result.length > iterator) {
      resultAverage.push(result[iterator].position);
      await this.pvzService.updatePeriod(
        result[iterator].position,
        result[iterator].differences,
        result[iterator].id,
      );

      iterator += 1;
    }

    const summa = resultAverage.reduce(
      (previous, current) => Number(previous) + Number(current),
    );

    const average = summa > 0 ? summa / resultAverage.length : 0;

    const newAverage = await this.averageService.create({
      average: String(average),
    });

    return newAverage;

  }
}
