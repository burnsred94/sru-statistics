import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({
  versionKey: false,
})
export class Article {
  @Prop({ type: String })
  article: string;

  @Prop({ type: String })
  productName: string;

  @Prop({ type: String })
  telegramId: string;

  @Prop({ type: String })
  email: string;

  @Prop({ type: String })
  city: string;

  @Prop({ type: String })
  city_id: string;

  @Prop({ type: Types.ObjectId, required: true })
  keys: [Types.ObjectId];
}

export const ArticleSchema = SchemaFactory.createForClass(Article);
