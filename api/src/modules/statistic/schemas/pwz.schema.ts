import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Period } from './periods.schema';
import { User } from 'src/modules/auth/user';

@Schema({
  versionKey: false,
})
export class Pwz {
  @Prop({ type: Number })
  userId: User;

  @Prop({ type: String, default: '' })
  article: string;

  @Prop({ type: String })
  name: string;

  @Prop({ type: [Types.ObjectId], ref: Period.name })
  position: Types.ObjectId[];
}

export const PwzSchema = SchemaFactory.createForClass(Pwz);
