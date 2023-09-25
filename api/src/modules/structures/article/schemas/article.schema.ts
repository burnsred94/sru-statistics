import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from 'src/modules/auth/user';
import { Keys } from '../../keys';

export type ArticleDocument = HydratedDocument<Article>;

@Schema({
  versionKey: false,
  timestamps: true,
})
export class Article {
  @Prop({ type: String })
  article: string;

  @Prop({ type: Number })
  userId: User;

  @Prop({ type: Types.ObjectId, default: null })
  pagination?: Types.ObjectId;

  @Prop({ type: String })
  productName: string;

  @Prop({ type: String, default: null })
  productRef: string;

  @Prop({ type: String, default: null })
  productImg: string;

  @Prop({ type: Boolean })
  active: boolean;

  @Prop({ type: [Types.ObjectId], ref: Keys.name })
  keys?: Types.ObjectId[];
}

export const ArticleSchema = SchemaFactory.createForClass(Article);
