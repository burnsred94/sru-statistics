import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { Pvz } from '../schemas';
import { PvzEntity } from '../entities';
import { StatusPvz } from 'src/interfaces';
import { Periods } from 'src/modules/periods';
import { User } from 'src/modules/auth';

@Injectable()
export class PvzRepository {
  constructor(@InjectModel(Pvz.name) private readonly pvzModel: Model<Pvz>) {}

  async create(data: Pvz) {
    const newPwz = new PvzEntity(data);
    const createPwz = await this.pvzModel.create({ ...newPwz });
    return createPwz;
  }

  async findAll() {
    return await this.pvzModel.find({
      // status: StatusPvz.SUCCESS,
      active: true,
    });
  }

  async findUserStatus(userId: User, article: string) {
    return await this.pvzModel.countDocuments({
      userId: userId,
      article: article,
      status: StatusPvz.WAIT_TO_SEND,
    });
  }

  async initStatus(id: string, active: boolean) {
    await this.pvzModel.findByIdAndUpdate({ _id: id }, { active: active });
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
        status: StatusPvz.PENDING,
      },
    );
  }

  async updateStatus(id: Types.ObjectId) {
    await this.pvzModel.findByIdAndUpdate({ _id: id }, { $set: { status: StatusPvz.SUCCESS } });
  }

  async findNonActive(id: string) {
    const data = await this.pvzModel.find({ key_id: id, status: StatusPvz.PENDING }).lean();
    return data.length;
  }

  async findActive(id: string) {
    const query = await this.pvzModel
      .find({ key_id: id, status: StatusPvz.SUCCESS })
      .populate({ path: 'position', select: 'position', model: Periods.name })
      .lean();

    return query;
  }

  async findPvz(id: Types.ObjectId) {
    return await this.pvzModel
      .findById({ _id: id })
      .populate({ path: 'position', select: 'position', model: Periods.name })
      .lean()
      .exec();
  }
}
