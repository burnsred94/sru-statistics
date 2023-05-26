import { Types } from 'mongoose';
import { IKeys } from 'src/modules/interfaces';
import { Pwz } from '../schemas/pwz.schema';

export class KeysEntity {
  key: string;
  article: string;
  telegramId: string;
  email: string;
  pwz: [Pwz];

  constructor(data: IKeys) {
    this.key = data.key;
    this.email = data.email;
    this.telegramId = data.telegramId;
    this.article = data.article;
    this.pwz = data.pwz;
  }
}
