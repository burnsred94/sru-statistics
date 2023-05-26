import { Types } from 'mongoose';

export interface IStatistic {
  email: string;
  telegramId: string;
  articles: [Types.ObjectId];
}
