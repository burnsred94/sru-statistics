import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { User } from 'src/modules/auth/user';
import { SUCCESS_DELETE_KEY } from 'src/constatnts/success.constants';
import { BadRequestException } from '@nestjs/common';
import { FAILED_DELETED_KEY } from 'src/constatnts/errors.constants';
import { KeysEntity } from '../entities';
import { Keys } from '../schemas';
import { Pvz } from 'src/modules/pvz';
import { Average } from 'src/modules/average';
import { Periods } from 'src/modules/periods';
import { forEach } from 'lodash';

@Injectable()
export class KeysRepository {
  constructor(
    @InjectModel(Keys.name) private readonly keysModel: Model<Keys>,
  ) { }

  async findByName(userId: string, name: string) {
    const find = await this.keysModel.find({ userId: userId, key: name })
    forEach(find, async (key) => {
      await this.keysModel.findByIdAndDelete(key._id)
    })
  }

  async find(data: { userId: number; cityId: string }) {
    return await this.keysModel
      .find({
        userId: data.userId,
        city_id: data.cityId,
      })
      .populate({ path: 'pwz', select: 'name article', model: Pvz.name });
  }

  async create(data: Keys) {
    const newKey = new KeysEntity(data);
    const createKey = await this.keysModel.create(newKey);
    return createKey._id;
  }

  async findById(id: Types.ObjectId) {
    return await this.keysModel
      .findById({ _id: id })
      .populate({
        path: 'pwz',
        select: 'name position',
        model: Pvz.name,
        populate: {
          path: 'position',
          select: 'position timestamp difference',
          model: Periods.name,
        },
      })
      .populate({
        path: 'average',
        select: 'timestamp average',
        model: Average.name,
      });
  }

  async updateAverage(id: Types.ObjectId, average: Types.ObjectId) {
    return await this.keysModel.updateOne(
      { _id: id },
      {
        $push: {
          average: average,
        },
      },
    );
  }

  async update(id, pvz) {
    await this.keysModel.updateOne(
      {
        _id: id,
      },
      {
        $set: {
          pwz: pvz,
        },
      },
    );
  }

  async updateAndPush(id, pvz) {
    return await this.keysModel.updateOne(
      {
        _id: id,
      },
      {
        $push: {
          pwz: pvz,
        },
      },
    );
  }
}
