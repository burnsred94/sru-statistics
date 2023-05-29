import { IsArray, IsString } from 'class-validator';

export class AddKeysDto {
  @IsString()
  cityId: string;

  @IsString()
  article: string;

  @IsArray()
  keys: string[];

  @IsString()
  userId: string;
}
