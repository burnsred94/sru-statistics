import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Average } from '../schemas';
import { Model, Types } from 'mongoose';
import { AverageEntity } from '../entities';
import { IAverage } from 'src/interfaces';

@Injectable()
export class AverageRepository {
  constructor(@InjectModel(Average.name) private readonly averageModel: Model<Average>) {}

  async create(data: IAverage) {
    const averageEntity = new AverageEntity(data);
    const newAverage = await this.averageModel.create(averageEntity);
    return newAverage.save();
  }

  async update(id: Types.ObjectId, data: string) {
    await this.averageModel.findByIdAndUpdate(
      {
        _id: id,
      },
      {
        $set: { average: data },
      },
    );
  }
}
