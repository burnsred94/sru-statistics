import { IsNotEmpty, IsString } from 'class-validator';

export class RemoveArticleDto {
  @IsNotEmpty()
  @IsString()
  articleId: string;
}
