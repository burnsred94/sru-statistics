import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { KeysEntity } from '../entities';
import { Keys } from '../schemas';
import { Pvz } from 'src/modules/pvz';
import { Average } from 'src/modules/average';
import { Periods } from 'src/modules/periods';
import { forEach } from 'lodash';
import { AverageStatus } from 'src/interfaces';

@Injectable()
export class KeysRepository {
  constructor(@InjectModel(Keys.name) private readonly keysModel: Model<Keys>) { }

  async findKey(id: string) {
    return await this.keysModel.findById(id).lean().exec();
  }

  async findKeysByUser(user: string) {
    return await this.keysModel
      .find({ userId: user })
      .populate({
        path: 'pwz',
        select: 'name geo_address_id active',
        model: Pvz.name,
      })
      .lean()
      .exec();
  }

  async findByName(userId: string, name: string) {
    const find = await this.keysModel.find({ userId: userId, key: name }).lean().exec();
    forEach(find, async key => {
      await this.keysModel.findByIdAndDelete(key._id);
    });
  }

  // 
  async selectToParser(statusSearch: AverageStatus, selected: { active: boolean, userId?: number }) {
    let query = this.keysModel.find(selected)
    query = query.populate({
      path: "average",
      select: "status_updated",
      model: Average.name
    });

    query = query
      .populate({
        path: 'pwz',
        select: 'name position city city_id geo_address_id',
        model: Pvz.name,
        populate: {
          path: 'position',
          select: 'position timestamp difference',
          model: Periods.name,
        },
      });

    const result = await query.lean().exec();

    const ids = [];

    const keys = result.filter((element: any) => {
      if (element.average.at(-1)?.status_updated !== undefined && element.average.at(-1).status_updated === statusSearch) {
        ids.push(element.average.at(-1)._id);
        return element
      }
    });

    return { data: keys, ids: ids };
  }



  async findToUpdateED() {
    let query = this.keysModel.find({ active: true });

    query = query.populate({
      path: "average",
      select: "status",
      match: { average: "Ожидается" },
      model: Average.name
    });

    query = query
      .populate({
        path: 'pwz',
        select: 'name position city city_id geo_address_id',
        model: Pvz.name,
        populate: {
          path: 'position',
          select: 'position timestamp difference',
          model: Periods.name,
        },
      });

    return await query.lean().exec();
  }

  async find(data: { userId: number; cityId: string }) {
    return await this.keysModel
      .find({
        userId: data.userId,
        city_id: data.cityId,
      })
      .populate({ path: 'pwz', select: 'name article', model: Pvz.name })
      .lean()
      .exec();
  }

  async create(data: Omit<Keys, 'active'>) {
    const newKey = new KeysEntity(data);
    const createKey = await this.keysModel.create(newKey);
    return createKey._id;
  }

  async findById(id: Types.ObjectId, searchObject: string) {
    let query = this.keysModel.findById({ _id: id });
    query =
      searchObject === 'all'
        ? query.populate({
          path: 'pwz',
          select: 'name position city city_id geo_address_id',
          match: { active: true },
          model: Pvz.name,
          populate: {
            path: 'position',
            select: 'position timestamp difference',
            model: Periods.name,
          },
        })
        : query.populate({
          path: 'pwz',
          select: 'name position city city_id geo_address_id',
          match: { city: searchObject, active: true },
          model: Pvz.name,
          populate: {
            path: 'position',
            select: 'position timestamp difference',
            model: Periods.name,
          },
        });

    query = query.populate({
      path: 'average',
      select: 'timestamp average difference',
      model: Average.name,
    });

    return await query.lean().exec();
  }

  async setStatusKey(id: Types.ObjectId, status: boolean) {
    return await this.keysModel.findByIdAndUpdate({ _id: id }, { $set: { active: status } });
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
