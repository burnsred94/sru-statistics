import { InjectModel } from '@nestjs/mongoose';
import { Pwz } from '../schemas/pwz.schema';
import { Model } from 'mongoose';
import { PwzEntity } from '../entity/pwz.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PwzRepository {
  constructor(@InjectModel(Pwz.name) private readonly pwzModel: Model<Pwz>) {}

  async create(data: Pwz) {
    const newPwz = new PwzEntity(data);
    const createPwz = await this.pwzModel.create(newPwz);
    const pwzSave = await createPwz.save();
    return pwzSave._id;
  }
}
