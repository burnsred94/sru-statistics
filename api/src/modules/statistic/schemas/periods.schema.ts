import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  versionKey: false,
})
export class Period {
  @Prop({ type: String })
  position: string;

  @Prop({ type: String })
  timestamp: string;

  @Prop({ type: String })
  difference: string;
}

export const PeriodSchema = SchemaFactory.createForClass(Period);
