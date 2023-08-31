import { Types } from 'mongoose';
import { User } from 'src/modules/auth/user';
import { Article } from '../schemas';

export class ArticleEntity {
  productName: string;
  article: string;
  userId: User;
  active: boolean;
  city_id: string;
  city: string;
  keys?: Types.ObjectId[];
  productRef: string;
  productImg: string;

  constructor(data: Article) {
    this.article = data.article;
    this.userId = data.userId;
    this.productRef = data.productRef;
    this.productImg = data.productImg;
    this.active = true;
    this.productName = data.productName;
    this.keys = data.keys?.length > 0 ? data.keys : [];
  }
}
