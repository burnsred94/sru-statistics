import { Types } from 'mongoose';
import { Pwz } from '../schemas/pwz.schema';

export class PwzEntity {
  article: string;
  userId: string;
  name: string;
  position: Types.ObjectId[];

  constructor(data: Pwz) {
    this.article = data.article;
    this.userId = data.userId;
    this.name = data.name;
    this.position = data.position;
  }
}
