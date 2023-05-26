import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Article } from './article.schema';
import { Types } from 'mongoose';

@Schema()
export class Cities {
  @Prop({ type: String })
  name: string;

  @Prop({ type: [Types.ObjectId], ref: Article.name, required: true })
  articles: [Article];
}

export const CitiesSchema = SchemaFactory.createForClass(Cities);
