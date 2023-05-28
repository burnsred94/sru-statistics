import { Types } from 'mongoose';
import { IKeys } from 'src/modules/interfaces';

export class KeysEntity {
  key: string;
  article: string;
  userId: string;
  pwz: { _id: Types.ObjectId }[];

  constructor(data: IKeys) {
    this.key = data.key;
    this.userId = data.userId;
    this.article = data.article;
    this.pwz = data.pwz;
  }
}
