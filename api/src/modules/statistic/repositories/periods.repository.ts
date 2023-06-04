import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { Period } from '../schemas/periods.schema';
import { PeriodsEntity } from '../entity/period.entity';

@Injectable()
export class PeriodRepository {
  constructor(
    @InjectModel(Period.name) private readonly periodModel: Model<Period>,
  ) {}

  async create(position: string, difference?: string) {
    const newPeriod = new PeriodsEntity(position, difference);
    const createPeriod = await this.periodModel.create(newPeriod);
    const newPeriodSave = await createPeriod.save();
    return newPeriodSave._id;
  }

  async deleteById(id: Types.ObjectId) {
    const deletePeriod = await this.periodModel.deleteOne({ _id: id });
    return deletePeriod.deletedCount;
  }
}
