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
}
