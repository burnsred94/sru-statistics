import { User } from 'src/modules/auth';

export interface IArticle {
  article: string;
  productRef: string;
  productImg: string;
  productName: string;
  city: string;
  userId: User;
  city_id: string;
  keys: Array<any>;
}

export interface Average {
  _id: string;
  timestamp: string;
  average: string;
}

export interface Pwz {
  _id: string;
  name: string;
  position: IPosition[];
}

export interface IPosition {
  _id: string;
  position: string;
  timestamp: string;
  difference: string;
}
