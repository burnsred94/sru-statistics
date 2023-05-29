import { Types } from 'mongoose';

export interface IArticle {
  article: string;
  city: string;
  userId: string;
  city_id: string;
  productName: string;
  keys: Types.ObjectId[];
}

export interface IArticleCron {
  _id: string;
  productName: string;
  article: string;
  city: string;
  userId: string;
  keys: Key[];
}

export interface Key {
  _id: string;
  key: string;
  pwz: Pwz[];
}

export interface Pwz {
  _id: string;
  name: string;
  position: Position[];
}

export interface Position {
  _id: string;
  position: string;
  timestamp: string;
  difference: string;
}
