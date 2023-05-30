import { IsArray, IsString } from 'class-validator';
import { User } from 'src/modules/auth/user';

export class GetOneDto {
  @IsString()
  article: string;
  @IsString()
  userId: User;
  @IsString()
  cityId: string;
  @IsArray()
  periods?: Array<string>;
}
