import { IsString } from 'class-validator';

export class RemoveKeyDto {
  @IsString()
  article: string;
  @IsString()
  cityId: string;
  @IsString()
  keyId: string;
}
