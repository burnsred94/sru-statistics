import { Types } from 'mongoose';
import { IStatistic } from 'src/modules/interfaces';

export class StatisticEntity {
  email: string;
  telegramId: string;
  articles: [Types.ObjectId];

  constructor(data: IStatistic) {
    this.email = data.email;
    this.telegramId = data.telegramId;
    this.articles = data.articles;
  }
}
