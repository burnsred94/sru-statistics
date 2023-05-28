import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { Period } from '../schemas/periods.schema';
import { PeriodsEntity } from '../entity/period.entity';

@Injectable()
export class PeriodRepository {
  constructor(
    @InjectModel(Period.name) private readonly periodModel: Model<Period>,
  ) {}

  async create(position: string | number) {
    const newPeriod = new PeriodsEntity(String(position));
    const createPeriod = await this.periodModel.create(newPeriod);
    const newPeriodSave = await createPeriod.save();
    return newPeriodSave._id;
  }
}
