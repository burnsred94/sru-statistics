import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from 'src/modules/auth/user';
import { Average } from '../../average';
import { Pvz } from '../../pvz';

export type KeysDocument = HydratedDocument<Keys>;

@Schema()
export class Keys {
  @Prop({ type: String })
  key: string;

  @Prop({ type: String })
  article: string;

  @Prop({ type: Number })
  userId: User;

  @Prop({ type: Boolean, default: true })
  active: boolean;

  @Prop({ type: Number, default: 0 })
  frequency: number;

  @Prop({ type: [Types.ObjectId], ref: Average.name })
  average: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: Pvz.name })
  pwz?: Types.ObjectId[];
}

export const KeysSchema = SchemaFactory.createForClass(Keys);
