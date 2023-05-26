import { Types } from 'mongoose';

export interface IArticle {
  article: string;
  city: string;
  telegramId: string;
  email: string;
  city_id: string;
  productName: string;
  keys: [Types.ObjectId];
}
