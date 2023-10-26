import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PaginationDocument = HydratedDocument<Pagination>;

@Schema({
  versionKey: false,
})
export class Pagination {
  @Prop({ type: Number, default: 10 })
  key_limit: number;

  @Prop({ type: Types.ObjectId, required: true })
  article_id: Types.ObjectId;

  @Prop({ type: Number, default: 1 })
  page: number;
}