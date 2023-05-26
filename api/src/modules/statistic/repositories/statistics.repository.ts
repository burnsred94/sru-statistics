import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Statistic } from '../schemas/statistics.schema';
import { Injectable } from '@nestjs/common';
import { StatisticEntity } from '../entity';
import { IStatistic } from 'src/modules/interfaces';

@Injectable()
export class StatisticRepository {
  constructor(
    @InjectModel(Statistic.name)
    private readonly statisticModel: Model<Statistic>,
  ) {}

  async create(statistic: IStatistic): Promise<Statistic> {
    const newStatistic = new StatisticEntity(statistic);
    const createStatistic = await this.statisticModel.create(newStatistic);
    return createStatistic.save();
  }
}
