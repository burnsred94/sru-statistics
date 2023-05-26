import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Pwz } from './pwz.schema';
import { Types } from 'mongoose';

@Schema()
export class Keys {
  @Prop({ type: String, required: true })
  key: string;

  @Prop({ type: String, required: true })
  article: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: String })
  telegramId: string;

  @Prop({ type: String })
  address: string;

  @Prop({ type: [Types.ObjectId], ref: Pwz.name })
  pwz: [Types.ObjectId];
}

export const KeysSchema = SchemaFactory.createForClass(Keys);
