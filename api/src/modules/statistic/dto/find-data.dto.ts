import { IsArray, IsString } from 'class-validator';

export class FindDataDto {
  @IsArray()
  periods: string[];
  @IsString()
  city: string;
}
