import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';
import { Types } from 'mongoose';

export class FolderUpdateDto {
  @IsString()
  name: string;

  @Transform(data => (data.obj.article_id = new Types.ObjectId(data.value)))
  article_id: Types.ObjectId;
}
