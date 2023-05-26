import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Cities } from './cities.schema';

@Schema({
  versionKey: false,
})
export class Statistic {
  @Prop({ types: String, required: true })
  email: string;

  @Prop({ types: String, required: true })
  telegramId: string;

  @Prop({ types: [Types.ObjectId], ref: Cities.name, required: true })
  city: [Cities];
}

export const StatisticSchema = SchemaFactory.createForClass(Statistic);
