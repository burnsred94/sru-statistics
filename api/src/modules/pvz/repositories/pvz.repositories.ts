import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { Pvz } from '../schemas';
import { PvzEntity } from '../entities';
import { Periods } from 'src/modules/periods';

@Injectable()
export class PvzRepository {
  constructor(@InjectModel(Pvz.name) private readonly pvzModel: Model<Pvz>) {}

  async create(data: Pvz) {
    const newPwz = new PvzEntity(data);
    const createPwz = await this.pvzModel.create({ ...newPwz });
    return createPwz;
  }

  //   async findById(id: Types.ObjectId) {
  //     return await this.pwzModel
  //       .findById(id)
  //       .populate('position', null, Period.name);
  //   }

  //   async update(periodId: Types.ObjectId, idPwz: Types.ObjectId) {
  //     const find = await this.pwzModel.findById({
  //       _id: idPwz,
  //     });
  //     return await this.pwzModel.findByIdAndUpdate(
  //       {
  //         _id: idPwz,
  //       },
  //       {
  //         position: [...find.position, periodId],
  //       },
  //     );
  //   }

  //   async deleteById(id: Types.ObjectId) {
  //     return await this.pwzModel.deleteOne({ _id: id });
  //   }
}
