import { IsNotEmpty } from 'class-validator';
import { User } from 'src/modules/auth';

export class SMFindByCityDto {
  @IsNotEmpty()
  data: SMDataFindByCity;
  @IsNotEmpty()
  query: SMQueryFindByCity;
}

export interface SMDataFindByCity {
  userId: number;
  city_id: string;
  periods: string[];
}

export interface SMQueryFindByCity {
  page: number;
  limit: number;
  articleId: string;
}
