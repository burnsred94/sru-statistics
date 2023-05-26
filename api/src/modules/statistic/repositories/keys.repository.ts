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
    const find = await this.keysModel.findOne({
      key: data.key,
      article: data.article,
      address: data.address,
      email: data.email,
      telegramId: data.telegramId,
    });

    if (find === null) {
      const newKey = new KeysEntity(data);
      const createKey = await this.keysModel.create(newKey);
      return createKey.save();
    } else {
      const update = await this.keysModel.findOneAndUpdate(
        {
          key: data.key,
          article: data.article,
          address: data.address,
          email: data.email,
          telegramId: data.telegramId,
        },
        {
          $addToSet: {
            pwz: data.pwz,
          },
        },
        {
          new: true,
        },
      );
      return update.save();
    }
  }

  // async update(key: Keys): Promise<Keys> {
  //     return this.keysModel.updateOne({ name: key.name }, key);
  // }
}
