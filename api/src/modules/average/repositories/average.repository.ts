import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Average } from '../schemas';
import { Model, Types } from 'mongoose';
import { AverageEntity } from '../entities';
import { AverageStatus, IAverage } from 'src/interfaces';

@Injectable()
export class AverageRepository {
  constructor(@InjectModel(Average.name) private readonly averageModel: Model<Average>) { }

  async create(data: IAverage) {
    const averageEntity = new AverageEntity(data);
    const newAverage = await this.averageModel.create(averageEntity);
    return newAverage.save();
  }

  async findOne(id: Types.ObjectId) {
    return await this.averageModel.findOne({ _id: id });
  }

  async update(id: Types.ObjectId, data: string) {
    return await this.averageModel.findByIdAndUpdate(
      {
        _id: id,
      },
      {
        $set: { average: data, status_updated: AverageStatus.SUCCESS },
      },
    );
  }

  async updateDiff(id: Types.ObjectId, data: string) {
    await this.averageModel.findByIdAndUpdate(
      {
        _id: id,
      },
      {
        $set: { difference: data },
      },
    );
  }

  async statusUp(id: Types.ObjectId[], status: AverageStatus) {
    await this.averageModel.updateMany({ _id: id }, { status_updated: status });
  }

  async getCountDocuments(searchObject): Promise<number> {
    return await this.averageModel.countDocuments(searchObject);
  }
}
