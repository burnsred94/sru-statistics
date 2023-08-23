import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateArticleDto {
  @IsNotEmpty()
  @IsString()
  article: string;

  @IsNotEmpty()
  @IsArray()
  keys: Array<string>;
}
