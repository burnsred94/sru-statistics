import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { Pvz } from '../schemas';
import { PvzEntity } from '../entities';

@Injectable()
export class PvzRepository {
  constructor(@InjectModel(Pvz.name) private readonly pvzModel: Model<Pvz>) { }

  async create(data: Pvz) {
    const newPwz = new PvzEntity(data);
    const createPwz = await this.pvzModel.create({ ...newPwz });
    return createPwz;
  }

  async update(id, data) {
    await this.pvzModel.updateOne({
      _id: id,
    },
      {
        $push: {
          position: data
        }
      }
    )
  }
}
