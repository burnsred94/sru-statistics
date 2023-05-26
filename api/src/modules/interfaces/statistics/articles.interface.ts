import { Types } from 'mongoose';
import { Keys } from 'src/modules/statistic/schemas/keys.schema';

export interface IArticle {
  article: string;
  city: string;
  telegramId: string;
  email: string;
  city_id: string;
  productName: string;
  keys: [Keys];
}
