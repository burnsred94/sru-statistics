import { IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class RemoveKeyDto {
  @IsNotEmpty()
  @IsString({ each: true })
  keysId: Types.ObjectId[];
}
