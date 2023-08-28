import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
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

  //Для подсчета разницы между средними
  async findAverageKey(id: Types.ObjectId) {
    const key = await this.keysModel.findById(id)
      .populate({ path: 'average', select: "average", model: Average.name })
      .lean()
      .exec()
    return [key.average.at(-1), key.average.at(-2)].includes(undefined) ? [] : [key.average.at(-1), key.average.at(-2)]
  }

  async addedAverageToKey(id_key: Types.ObjectId, id_average: Types.ObjectId) {
    const result = await this.keysModel.updateOne({ _id: id_key }, { $push: { average: id_average } });
    return result.modifiedCount > 0;
  }

  async findAll(searchObject: FilterQuery<Keys>) {
    return await this.keysModel.find(searchObject)
      .populate({ path: 'pwz', select: 'name geo_address_id name', model: Pvz.name })
      .lean()
      .exec();
  }

  async updateMany(ids: Array<Types.ObjectId>) {
    const result = await this.keysModel.updateMany({ _id: ids }, { active: false });
    return result.modifiedCount > 0
  }

  async countUserKeys(userId: number, status: boolean) {
    return await this.keysModel.countDocuments({ userId: userId, active: status })
  }

  async create(data: Omit<Keys, 'active'>) {
    const newKey = new KeysEntity(data);
    const createKey = await this.keysModel.create(newKey);
    return createKey._id;
  }

  async findByMany(searchQuery: FilterQuery<Keys>, searchCity: string) {
    let find = this.keysModel.find(searchQuery);

    find =
      searchCity === 'all'
        ? find.populate({
          path: 'pwz',
          select: 'name position city city_id geo_address_id',
          match: { active: true },
          model: Pvz.name,
          populate: {
            path: 'position',
            select: 'position timestamp difference promo_position cpm',
            model: Periods.name,
          },
        })
        : find.populate({
          path: 'pwz',
          select: 'name position city city_id geo_address_id',
          match: { city: searchCity, active: true },
          model: Pvz.name,
          populate: {
            path: 'position',
            select: 'position timestamp difference',
            model: Periods.name,
          },
        });

    find = find.populate({
      path: 'average',
      select: 'timestamp average difference start_position cpm',
      model: Average.name,
    });

    return await find.lean().exec();
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
