import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  versionKey: false,
})
export class Average {
  @Prop({ type: String, require: true })
  timestamp: string;

  @Prop({ type: String, require: true })
  average: string;

  @Prop({ type: String, require: true })
  difference: string;
}

export const AverageSchema = SchemaFactory.createForClass(Average);
