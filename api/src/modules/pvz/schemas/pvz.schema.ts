import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Article } from 'src/modules/article';
import { User } from 'src/modules/auth/user';
import { Periods } from 'src/modules/periods';

@Schema({
  versionKey: false,
})
export class Pvz {
  @Prop({ type: Number })
  userId: User;

  @Prop({ type: String })
  article: string;

  @Prop({ type: String })
  name: string;

  @Prop({ type: [Types.ObjectId], ref: Periods.name })
  position: Types.ObjectId[];
}

export const PvzSchema = SchemaFactory.createForClass(Pvz);
