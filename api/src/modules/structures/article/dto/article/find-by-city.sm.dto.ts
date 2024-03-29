import { IsNotEmpty } from 'class-validator';

export class SMFindByCityDto {
  @IsNotEmpty()
  data: SMDataFindByCity;
  @IsNotEmpty()
  query: SMQueryFindByCity;
}

export interface SMDataFindByCity {
  userId: number;
  city: string;
  periods: string[];
}

export interface SMQueryFindByCity {
  page: number;
  limit: number;
  articleId: string;
}
