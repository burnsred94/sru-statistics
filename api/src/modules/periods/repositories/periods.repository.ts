import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Periods } from '../schemas';
import { PeriodsEntity } from '../entities';
import { StatusPvz } from 'src/interfaces';

@Injectable()
export class PeriodsRepository {
  constructor(
    @InjectModel(Periods.name) private readonly periodModel: Model<Periods>,
  ) { }

  async create(position: string, difference?: string) {
    const newPeriod = new PeriodsEntity(position, difference);
    const createPeriod = await this.periodModel.create(newPeriod);
    const newPeriodSave = await createPeriod.save();
    return newPeriodSave._id;
  }

  async update(id: Types.ObjectId, position: string) {
    return await this.periodModel.findByIdAndUpdate(
      { _id: id },
      { $set: { position: position, status: StatusPvz.SUCCESS } },
    );
  }
}
