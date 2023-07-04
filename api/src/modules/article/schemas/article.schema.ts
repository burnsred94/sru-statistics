import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { User } from 'src/modules/auth/user';
import { Keys } from 'src/modules/keys';

@Schema({
  versionKey: false,
})
export class Article {
  @Prop({ type: String })
  article: string;

  @Prop({ type: Number })
  userId: User;

  @Prop({ type: String })
  productName: string;

  @Prop({ type: String })
  productRef: string;

  @Prop({ type: String })
  productImg: string;

  @Prop({ type: Boolean })
  active: boolean;

  @Prop({ type: [Types.ObjectId], ref: Keys.name })
  keys?: Types.ObjectId[];
}

export const ArticleSchema = SchemaFactory.createForClass(Article);
