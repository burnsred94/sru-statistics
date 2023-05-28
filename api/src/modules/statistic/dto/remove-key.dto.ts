import { IsString } from 'class-validator';
import { Types } from 'mongoose';

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
