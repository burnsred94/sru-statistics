import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MetricsDocument = HydratedDocument<Metrics>;

export interface MetricData {
  ts: Date;
  met: number;
}

export interface MetricCity {
  city: string;
  pos: number;
  diff: number;
}

@Schema({
  versionKey: false,
})
export class Metrics {
  @Prop({ type: Number, required: true })
  user: number;

  @Prop({ type: Types.ObjectId, required: true })
  article: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  top_100: number;

  @Prop({ type: Number, default: 0 })
  top_1000: number;

  @Prop({ type: Number, default: 0 })
  indexes: number;

  @Prop({ type: Array<MetricData>, default: [] })
  middle_pos_organic: Array<MetricData>;

  @Prop({ type: Array<MetricData>, default: [] })
  middle_pos_adverts: Array<MetricData>;

  @Prop({ type: Array<MetricCity>, default: [] })
  middle_pos_cities: Array<MetricCity>;
}

export const MetricsSchema = SchemaFactory.createForClass(Metrics);
