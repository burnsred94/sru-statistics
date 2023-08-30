import { Types } from 'mongoose';
import { User } from 'src/modules/auth/user';
import { Keys } from '../schemas';

export class KeysEntity {
  key: string;
  article: string;
  average: Types.ObjectId[];
  userId: User;
  frequency: number;
  active: boolean;
  city_id: string;
  pwz?: Types.ObjectId[];

  constructor(data: Omit<Keys, 'active'>) {
    this.key = data.key;
    this.userId = data.userId;
    this.article = data.article;
    this.frequency = data.frequency;
    this.active = true;
    this.pwz = data.pwz ?? [];
    this.average = data.average;
  }
}
