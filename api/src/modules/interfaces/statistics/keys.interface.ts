import { Types } from 'mongoose';

export interface IKeys {
  key: string;
  article: string;
  userId: string;
  pwz: { _id: Types.ObjectId }[];
}
