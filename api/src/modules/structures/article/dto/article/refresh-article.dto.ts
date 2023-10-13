import { IsString } from 'class-validator';
import { Types } from 'mongoose';

export class RefreshArticleDto {
  @IsString()
  article: Types.ObjectId;
}
