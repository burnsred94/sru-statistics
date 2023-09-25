import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from 'src/modules/auth/user';
import { Periods } from '../../periods';

export type PvzDocument = HydratedDocument<Pvz>;

@Schema({
  versionKey: false,
})
export class Pvz {
  @Prop({ type: Number })
  userId: User;

  @Prop({ type: String })
  city: string;

  @Prop({ type: String })
  key_id: string;

  @Prop({ type: String })
  geo_address_id: string;

  @Prop({ type: String })
  article: string;

  @Prop({ type: String })
  name: string;

  @Prop({ type: [Types.ObjectId], ref: Periods.name })
  position: Types.ObjectId[];
}

export const PvzSchema = SchemaFactory.createForClass(Pvz);
