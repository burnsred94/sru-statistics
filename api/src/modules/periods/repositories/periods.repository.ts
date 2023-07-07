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

  async update(id: Types.ObjectId, position: number) {
    const pos = position === 0 ? '1000+' : String(position);
    return await this.periodModel.findByIdAndUpdate(
      { _id: id },
      { position: pos, status: StatusPvz.SUCCESS },
    );
  }

  async updateDiff(id: Types.ObjectId, diff: string) {
    await this.periodModel.findByIdAndUpdate(
      { _id: id },
      { difference: diff }
    )
  }
}
