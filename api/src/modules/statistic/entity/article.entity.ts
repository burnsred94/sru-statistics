import { Types } from 'mongoose';
import { User } from 'src/modules/auth/user';
import { IArticle } from 'src/modules/interfaces';

export class ArticleEntity {
  article: string;
  productName: string;
  userId: User;
  city_id: string;
  city: string;
  keys: Types.ObjectId[];

  constructor(data: IArticle) {
    this.article = data.article;
    this.userId = data.userId;
    this.city_id = data.city_id;
    this.city = data.city;
    this.productName = data.productName;
    this.keys = data.keys;
  }
}
