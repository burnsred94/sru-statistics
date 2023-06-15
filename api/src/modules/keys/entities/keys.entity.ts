import { Types } from 'mongoose';
import { User } from 'src/modules/auth/user';
import { IKeys } from '../interfaces';

export class KeysEntity {
  key: string;
  article: string;
  average: Types.ObjectId[];
  userId: User;
  city_id: string;
  pwz?: Types.ObjectId[];

  constructor(data: IKeys) {
    this.key = data.key;
    this.userId = data.userId;
    this.city_id = data.city_id;
    this.article = data.article;
    this.pwz = data.pwz ?? [];
    this.average = data.average;
  }
}
