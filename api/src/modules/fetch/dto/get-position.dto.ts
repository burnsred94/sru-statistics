import { IsNotEmpty, IsString } from 'class-validator';

export class GetPositionDto {
  @IsNotEmpty()
  @IsString()
  article: string;

  @IsNotEmpty()
  @IsString()
  key: string;
}
