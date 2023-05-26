import { Types } from 'mongoose';

export interface IKeys {
  key: string;
  article: string;
  telegramId: string;
  email: string;
  pwz: [Types.ObjectId];
}
