import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Period } from './periods.schema';

@Schema({
  versionKey: false,
})
export class Pwz {
  @Prop({ type: String })
  userId: string;

  @Prop({ type: String, default: '' })
  article: string;

  @Prop({ type: String })
  name: string;

  @Prop({ type: [Types.ObjectId], ref: Period.name })
  position: Types.ObjectId[];
}

export const PwzSchema = SchemaFactory.createForClass(Pwz);
