import { IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class UpdatePvzDto {
  @IsNotEmpty()
  @IsString()
  article: string;
  @IsNotEmpty()
  @IsString()
  name: string;
  @IsNotEmpty()
  @IsString()
  addressId: Types.ObjectId;
  @IsNotEmpty()
  @IsString()
  periodId: Types.ObjectId;
  @IsNotEmpty()
  @IsString()
  position: string;
  @IsNotEmpty()
  @IsString()
  key: string;
  @IsNotEmpty()
  @IsString()
  key_id: string;
}
