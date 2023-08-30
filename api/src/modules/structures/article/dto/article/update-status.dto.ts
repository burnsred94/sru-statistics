import { IsArray, IsNotEmpty } from 'class-validator';

export class RemoveArticleDto {
  @IsNotEmpty()
  @IsArray()
  articleId: string[];
}
