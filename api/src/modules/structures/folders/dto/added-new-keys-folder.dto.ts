import { Transform } from 'class-transformer';
import { IsArray } from 'class-validator';
import { Types } from 'mongoose';

export class AddNewKeysToFolderDto {
  @Transform(data => (data.obj.article_id = new Types.ObjectId(data.value)))
  article_id: Types.ObjectId;

  @IsArray()
  keys: string[];
}
