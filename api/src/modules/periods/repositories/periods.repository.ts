import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Periods } from '../schemas';
import { PeriodsEntity } from '../entities';

@Injectable()
export class PeriodsRepository {
  constructor(
    @InjectModel(Periods.name) private readonly periodModel: Model<Periods>,
  ) { }

  async create(position: string, difference?: string) {
    const newPeriod = new PeriodsEntity(position, difference);
    console.log(newPeriod);
    const createPeriod = await this.periodModel.create(newPeriod);
    console.log(createPeriod);
    const newPeriodSave = await createPeriod.save();
    return newPeriodSave._id;
  }
}
