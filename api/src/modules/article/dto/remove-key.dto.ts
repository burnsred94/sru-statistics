import { IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class RemoveKeyDto {
  @IsNotEmpty()
  @IsString()
  keyId: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  articleId: string;
}
