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

  async update(id: Types.ObjectId, data: number): Promise<boolean> {
    const find = await this.averageModel.findById({ _id: id })
      .lean()
      .exec();

    const average = find.average === 'Ожидается' || find.average === '1000+' ? 0 : Number(find.average);

    const delimiter = find.delimiter;

    if (data === 0) {
      const result = average > 0 ? String(average) : '1000+'
      await this.averageModel.findByIdAndUpdate(
        { _id: id },
        { average: result, status_updated: AverageStatus.SUCCESS, $inc: { delimiter: 1 } }
      )
    } else {
      const old = (average * delimiter);
      const mathOld = old + data;
      const result = Math.round(mathOld / (delimiter + 1));

      await this.averageModel.findByIdAndUpdate(
        { _id: id },
        { average: String(result), status_updated: AverageStatus.SUCCESS, $inc: { delimiter: 1 } },
        { new: true }
      )
    }

    return find.delimiter === 14;
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
