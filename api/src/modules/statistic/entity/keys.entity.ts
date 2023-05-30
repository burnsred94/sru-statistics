import { Types } from 'mongoose';
import { User } from 'src/modules/auth/user';
import { IKeys } from 'src/modules/interfaces';

export class KeysEntity {
  key: string;
  article: string;
  userId: User;
  pwz: Types.ObjectId[];

  constructor(data: IKeys) {
    this.key = data.key;
    this.userId = data.userId;
    this.article = data.article;
    this.pwz = data.pwz;
  }
}
