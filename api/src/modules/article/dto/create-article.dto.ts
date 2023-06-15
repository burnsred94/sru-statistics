import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { ITown } from '../interfaces';

export class CreateArticleDto {
  @IsNotEmpty()
  @IsArray()
  towns: ITown[];

  @IsNotEmpty()
  @IsString()
  article: string;

  @IsNotEmpty()
  @IsArray()
  keys: Array<string>;
}
