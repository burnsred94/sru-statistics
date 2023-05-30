import { Types } from 'mongoose';
import { User } from 'src/modules/auth/user';

export interface IKeys {
  key: string;
  article: string;
  userId: User;
  pwz: Types.ObjectId[];
}
