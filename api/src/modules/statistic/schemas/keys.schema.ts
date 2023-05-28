import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Pwz } from './pwz.schema';
import { Types } from 'mongoose';

@Schema()
export class Keys {
  @Prop({ type: String })
  key: string;

  @Prop({ type: String })
  article: string;

  @Prop({ type: String })
  userId: string;

  @Prop({ type: [Types.ObjectId], ref: Pwz.name })
  pwz: Types.ObjectId[];
}

export const KeysSchema = SchemaFactory.createForClass(Keys);
