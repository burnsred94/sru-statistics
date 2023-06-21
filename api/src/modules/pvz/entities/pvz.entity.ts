import { Types } from 'mongoose';
import { User } from 'src/modules/auth/user';
import { Pvz } from '../schemas';

export class PvzEntity {
  article: string;
  userId: User;
  active: boolean;
  name: string;
  position: Types.ObjectId[];

  constructor(data: Pvz) {
    this.article = data.article;
    this.userId = data.userId;
    this.active = true;
    this.name = data.name;
    this.position = data.position;
  }
}
