import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Keys } from '../../keys';
import { Article } from '../../article';
import { User } from 'src/modules/auth';

export type FolderDocument = HydratedDocument<Folder>;

@Schema({
  versionKey: false,
  timestamps: true,
})
export class Folder {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: Number, required: true })
  user: User;

  @Prop({ type: Types.ObjectId, ref: Article.name, required: true })
  article_id: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], default: [], ref: Keys.name })
  keys: Types.ObjectId[];
}

export const FolderSchema = SchemaFactory.createForClass(Folder);
