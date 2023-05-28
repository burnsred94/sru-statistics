import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  versionKey: false,
})
export class Period {
  @Prop({ type: String })
  position: string;

  @Prop({ type: String })
  timestamp: string;

  @Prop({ type: Number })
  difference: number;
}

export const PeriodSchema = SchemaFactory.createForClass(Period);
