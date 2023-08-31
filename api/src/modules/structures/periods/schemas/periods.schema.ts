import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  versionKey: false,
})
export class Periods {
  @Prop({ type: String })
  position: string;

  @Prop({ type: String, default: null })
  promo_position: string;

  @Prop({ type: String, default: null })
  cpm: string;

  @Prop({ type: String })
  timestamp: string;

  @Prop({ type: String })
  status: string;

  @Prop({ type: String })
  difference: string;
}

export const PeriodSchema = SchemaFactory.createForClass(Periods);
