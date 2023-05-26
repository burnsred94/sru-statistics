import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import {
  ICreateStatistic,
  ITown,
} from 'src/modules/interfaces/requested/create-requested.interface';

export class CreateStatisticDto implements ICreateStatistic {
  @IsString()
  telegramId: string;
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsArray()
  towns: ITown[];

  @IsNotEmpty()
  @IsString()
  article: string;

  @IsNotEmpty()
  @IsArray()
  keys: Array<string>;
}
