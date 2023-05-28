import { InjectModel } from '@nestjs/mongoose';
import { Keys } from '../schemas/keys.schema';
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { KeysEntity } from '../entity';

@Injectable()
export class KeysRepository {
  constructor(
    @InjectModel(Keys.name) private readonly keysModel: Model<Keys>,
  ) {}

  async create(data: Keys) {
    const newKey = new KeysEntity(data);
    const createKey = await this.keysModel.create(newKey);
    const keySave = await createKey.save();
    return keySave._id;
  }

  // async update(key: Keys): Promise<Keys> {
  //     return this.keysModel.updateOne({ name: key.name }, key);
  // }
}
