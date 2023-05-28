import { IsArray, IsString } from 'class-validator';

export class FindDataDto {
  @IsString()
  userId: string;
  @IsArray()
  periods: string[];
  @IsString()
  city: string;
}
