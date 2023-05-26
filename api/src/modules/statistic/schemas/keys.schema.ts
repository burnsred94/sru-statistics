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
  email: string;

  @Prop({ type: String })
  telegramId: string;

  @Prop({ type: [Pwz.name], ref: Pwz.name })
  pwz: [Pwz];
}

export const KeysSchema = SchemaFactory.createForClass(Keys);
