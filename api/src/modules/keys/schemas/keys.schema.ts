import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// import { Pwz } from './pwz.schema';
import { Types } from 'mongoose';
import { Article } from 'src/modules/article';
import { User } from 'src/modules/auth/user';
import { Average } from 'src/modules/average';
import { Pvz } from 'src/modules/pvz';

@Schema()
export class Keys {
  @Prop({ type: String })
  key: string;

  @Prop({ type: String })
  article: string;

  @Prop({ type: Number })
  userId: User;

  @Prop({ type: String })
  city_id: string;

  @Prop({ type: [Types.ObjectId], ref: Average.name })
  average: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: Pvz.name })
  pwz: Types.ObjectId[];
}

export const KeysSchema = SchemaFactory.createForClass(Keys);
