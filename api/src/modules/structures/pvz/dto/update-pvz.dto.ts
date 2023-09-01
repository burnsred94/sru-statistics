import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
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
  averageId: Types.ObjectId;
  @IsNotEmpty()
  @IsString()
  periodId: Types.ObjectId;
  @IsNotEmpty()
  @IsNumber()
  position: { cpm: number; promotion: number; promoPosition: number; position: number };
  @IsNotEmpty()
  @IsString()
  key: string;
  @IsNotEmpty()
  @IsString()
  key_id: Types.ObjectId;
}
