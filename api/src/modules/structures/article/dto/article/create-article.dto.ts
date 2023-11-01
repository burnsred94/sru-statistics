import { Transform } from 'class-transformer';
import { IsArray, IsString } from 'class-validator';
import { keywordsUniq } from '../../utils';

export class CreateArticleDto {
  @IsString()
  article: string;

  @Transform(data => keywordsUniq(data.obj.keys))
  @IsArray()
  keys: Array<string>;
}
