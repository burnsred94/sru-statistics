import { InjectModel } from '@nestjs/mongoose';
import { Pwz } from '../schemas/pwz.schema';
import { Model, Types } from 'mongoose';
import { PwzEntity } from '../entity/pwz.entity';
import { Injectable } from '@nestjs/common';
import { Period } from '../schemas/periods.schema';

@Injectable()
export class PwzRepository {
  constructor(@InjectModel(Pwz.name) private readonly pwzModel: Model<Pwz>) {}

  async create(data: Pwz) {
    const newPwz = new PwzEntity(data);
    const createPwz = await this.pwzModel.create(newPwz);
    const pwzSave = await createPwz.save();
    return pwzSave._id;
  }

  async findById(id: Types.ObjectId) {
    return await this.pwzModel
      .findById(id)
      .populate('position', null, Period.name);
  }

  async update(periodId: Types.ObjectId, idPwz: Types.ObjectId) {
    const find = await this.pwzModel.findById({
      _id: idPwz,
    });
    return await this.pwzModel.findByIdAndUpdate(
      {
        _id: idPwz,
      },
      {
        position: [...find.position, periodId],
      },
    );
  }

  async deleteById(id: Types.ObjectId) {
    return await this.pwzModel.deleteOne({ _id: id });
  }
}
