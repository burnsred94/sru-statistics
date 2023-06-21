import { IsArray, IsNumber, IsObject } from 'class-validator';
import { IDataProfile } from '../interfaces';

export class UpdateFromProfileDto {
  @IsNumber()
  status: number;
  @IsObject()
  data: IDataProfile;
  @IsArray()
  errors: any[];
}
