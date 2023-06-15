import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Average } from '../schemas';
import { Model } from 'mongoose';
import { IAverage } from '../interfaces';
import { AverageEntity } from '../entities';

@Injectable()
export class AverageRepository {
  constructor(
    @InjectModel(Average.name) private readonly averageModel: Model<Average>,
  ) {}

  async create(data: IAverage) {
    const averageEntity = new AverageEntity(data);
    const newAverage = await this.averageModel.create(averageEntity);
    return newAverage.save();
  }
}
