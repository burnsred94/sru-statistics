import { InjectModel } from '@nestjs/mongoose';
import { Keys } from '../schemas/keys.schema';
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { KeysEntity } from '../entity';
import { User } from 'src/modules/auth/user';

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

  async findOne(user: User, key: string, article: string) {
    const findKey = await this.keysModel.findOne({
      userId: user,
      key: key,
      article: article,
    });
    return findKey;
  }
}
