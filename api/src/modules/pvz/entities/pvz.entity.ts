import { Types } from 'mongoose';
import { User } from 'src/modules/auth/user';
import { Pvz } from '../schemas';

export class PvzEntity {
  article: string;
  userId: User;
  active: boolean;
  status: string;
  city: string;
  geo_address_id: string;
  key_id: string;
  name: string;
  position: Types.ObjectId[];

  constructor(data: Pvz) {
    this.article = data.article;
    this.userId = data.userId;
    this.city = data.city;
    this.geo_address_id = data.geo_address_id;
    this.key_id = data.key_id;
    this.status = data.status;
    this.active = true;
    this.name = data.name;
    this.position = data.position;
  }
}
