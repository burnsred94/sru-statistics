import { Types } from 'mongoose';

export interface IArticle {
  article: string;
  city: string;
  userId: string;
  city_id: string;
  productName: string;
  keys: Types.ObjectId[];
}
