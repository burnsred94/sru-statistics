import { IsObject, IsString } from 'class-validator';
import { PaginationFolder } from '../types';

export class GetOneFolderDto {
  @IsString({ each: true })
  period: Array<string>;

  @IsObject()
  pagination: PaginationFolder;
}
