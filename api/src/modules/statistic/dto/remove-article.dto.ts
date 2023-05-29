import { IsString } from 'class-validator';

export class RemoveArticleDto {
  @IsString()
  article: string;
  @IsString()
  cityId: string;
  @IsString()
  userId: string;
}
