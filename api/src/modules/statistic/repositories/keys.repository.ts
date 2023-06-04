import { InjectModel } from '@nestjs/mongoose';
import { Keys } from '../schemas/keys.schema';
import { Model, Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { KeysEntity } from '../entity';
import { User } from 'src/modules/auth/user';
import { SUCCESS_DELETE_KEY } from 'src/constatnts/success.constants';
import { BadRequestException } from '@nestjs/common';
import { FAILED_DELETED_KEY } from 'src/constatnts/errors.constants';

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

  async findById(id: Types.ObjectId) {
    return await this.keysModel.findById(id);
  }

  async delete(keyId: string) {
    const remove = await this.keysModel.deleteOne({
      _id: keyId,
    });

    if (remove.deletedCount > 0) {
      return { message: SUCCESS_DELETE_KEY };
    } else {
      throw new BadRequestException(FAILED_DELETED_KEY);
    }
  }

  async update(keyId: Types.ObjectId, data: Types.ObjectId) {
    return await this.keysModel.findByIdAndUpdate(keyId, {
      $push: {
        pwz: data,
      },
    });
  }
}
