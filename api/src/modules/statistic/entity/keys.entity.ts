import { Types } from 'mongoose';
import { IKeys } from 'src/modules/interfaces';

export class KeysEntity {
  key: string;
  article: string;
  telegramId: string;
  email: string;
  pwz: [Types.ObjectId];

  constructor(data: IKeys) {
    this.key = data.key;
    this.email = data.email;
    this.telegramId = data.telegramId;
    this.article = data.article;
    this.pwz = data.pwz;
  }
}
