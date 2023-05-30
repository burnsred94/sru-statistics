import { IsArray, IsString } from 'class-validator';

export class GetOneDto {
  @IsString()
  article: string;
  @IsString()
  userId: string;
  @IsString()
  cityId: string;
  @IsArray()
  periods: Array<string>;
}
