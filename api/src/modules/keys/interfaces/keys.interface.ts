import { Types } from 'mongoose';
import { User } from 'src/modules/auth/user';
import { IDataKeyResult } from './key-search.interface';

export interface IKeys {
  key: string;
  article: string;
  average: Types.ObjectId[];
  city_id: string;
  userId: User;
  pwz?: Types.ObjectId[];
}

export interface ICreateKey {
  data: IDataKeyResult[];
  articleId: Types.ObjectId;
  key: string;
  city_id: string;
  userId: User;
}
