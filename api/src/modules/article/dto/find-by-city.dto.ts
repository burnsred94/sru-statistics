import { Transform } from 'class-transformer';
import { IsArray, IsInt, IsNumber, IsString } from 'class-validator';

export class FindByCityDto {
  @IsString()
  city: string;

  @IsArray()
  periods: string[];
}

export class FindByCityQueryDto {
  @IsInt()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  page: number;

  @IsInt()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  limit: number;

  @IsString()
  articleId: string;
}

export class SearchKeysDtoResponse {
  meta: { count: number; pages_count: number };
}
