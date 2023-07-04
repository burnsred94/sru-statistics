import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { Pvz } from '../schemas';
import { PvzEntity } from '../entities';
import { StatusPvz } from 'src/interfaces';
import { Periods } from 'src/modules/periods';

@Injectable()
export class PvzRepository {
  constructor(@InjectModel(Pvz.name) private readonly pvzModel: Model<Pvz>) { }

  async create(data: Pvz) {
    const newPwz = new PvzEntity(data);
    const createPwz = await this.pvzModel.create({ ...newPwz });
    return createPwz;
  }

  async update(id, data) {
    await this.pvzModel.updateOne(
      {
        _id: id,
      },
      {
        $push: {
          position: data,
        },
      },
    );
  }

  async updateStatus(id: Types.ObjectId) {
    await this.pvzModel.findByIdAndUpdate({ _id: id }, { $set: { status: StatusPvz.SUCCESS } })
  }

  async findNonActive(id: Types.ObjectId) {
    const data = await this.pvzModel.find({ key_id: id, status: StatusPvz.PENDING })
      .lean();
    return data.length;
  }

  async findActive(id: Types.ObjectId) {
    const query = await this.pvzModel.find({ key_id: id, status: StatusPvz.SUCCESS })
      .populate({ path: 'position', select: 'position', model: Periods.name })
      .lean();

    return query;
  }
}
