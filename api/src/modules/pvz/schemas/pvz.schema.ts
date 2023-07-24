import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { User } from 'src/modules/auth/user';
import { Periods } from 'src/modules/periods';

@Schema({
  versionKey: false,
})
export class Pvz {
  @Prop({ type: Number })
  userId: User;

  @Prop({ type: String })
  status: string;

  @Prop({ type: String })
  key_id: string;

  @Prop({ type: String })
  geo_address_id: string;

  @Prop({ type: String })
  article: string;

  @Prop({ type: Boolean })
  active: boolean;

  @Prop({ type: String })
  name: string;

  @Prop({ type: [Types.ObjectId], ref: Periods.name })
  position: Types.ObjectId[];
}

export const PvzSchema = SchemaFactory.createForClass(Pvz);
