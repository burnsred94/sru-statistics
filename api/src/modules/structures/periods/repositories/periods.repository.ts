import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Periods } from '../schemas';
import { PeriodsEntity } from '../entities';
import { StatusPvz } from 'src/interfaces';
import { UpdatePvzDto } from 'src/modules/pvz/dto';

@Injectable()
export class PeriodsRepository {
  constructor(@InjectModel(Periods.name) private readonly periodModel: Model<Periods>) { }

  async create(position: string, difference?: string) {
    const newPeriod = new PeriodsEntity(position, difference);
    const createPeriod = await this.periodModel.create(newPeriod);
    const newPeriodSave = await createPeriod.save();
    return newPeriodSave._id;
  }

  async update(id: Types.ObjectId, dataPosition: { cpm: number, promotion: number, promoPosition: number, position: number }) {

    if (dataPosition.position === -3) {
      return await this.periodModel.findByIdAndUpdate(
        { _id: id },
        { position: "Ожидается", status: StatusPvz.SUCCESS },
      );
    }

    if (dataPosition.position > 0) {
      return await this.periodModel.findByIdAndUpdate(
        { _id: id },
        { cpm: String(dataPosition.cpm), promo_position: String(dataPosition.promoPosition), position: String(dataPosition.position), status: StatusPvz.SUCCESS },
      )
    } else {
      const pos = dataPosition.position === -1 ? '1000+' : dataPosition.position === -2 ? 'Нет данных' : null;
      return await this.periodModel.findByIdAndUpdate(
        { _id: id },
        { position: pos, status: StatusPvz.SUCCESS },
      );
    }
  }

  async updateDiff(id: Types.ObjectId, diff: string) {
    await this.periodModel.findByIdAndUpdate({ _id: id }, { difference: diff });
  }
}
