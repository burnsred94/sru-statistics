import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AverageStatus } from 'src/interfaces';

@Schema({
  versionKey: false,
})
export class Average {
  @Prop({ type: String, require: true })
  timestamp: string;

  @Prop({ type: String, require: true })
  average: string;

  @Prop({ type: String, default: null })
  start_position: string;

  @Prop({ type: String, default: null })
  cpm: string;

  @Prop({ type: Number, require: true })
  userId: number;

  @Prop({ type: Number, require: true, default: 0 })
  delimiter: number;

  @Prop({ type: Number, require: true, default: 0 })
  loss_delimiter: number;

  @Prop({ type: String, require: true, default: AverageStatus.WAIT_SENDING })
  status_updated: string;

  @Prop({ type: String, require: true })
  difference: string;
}

export const AverageSchema = SchemaFactory.createForClass(Average);
