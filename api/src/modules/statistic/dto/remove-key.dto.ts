import { IsString } from 'class-validator';

export class RemoveKeyDto {
  @IsString()
  article: string;
  @IsString()
  cityId: string;
  @IsString()
  userId: string;
  @IsString()
  keyId: string;
}
