import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { PeriodsEntity } from '../entity/period.entity';

@Schema({
  versionKey: false,
})
export class Pwz {
  @Prop({ type: String, default: '' })
  email: string;

  @Prop({ type: String, default: '' })
  telegramId: string;

  @Prop({ type: String, default: '' })
  article: string;

  @Prop({ type: String })
  name: string;

  @Prop({ type: Array<PeriodsEntity>, required: false })
  position: Array<PeriodsEntity>;
}

export const PwzSchema = SchemaFactory.createForClass(Pwz);
