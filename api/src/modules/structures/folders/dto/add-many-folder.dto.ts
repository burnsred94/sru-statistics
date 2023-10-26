import { IsString } from 'class-validator';
import { Types } from 'mongoose';

export class AddManyFolderDto {
  @IsString({ each: true })
  ids_folders: Types.ObjectId[];

  @IsString({ each: true })
  ids_keys: Types.ObjectId[];
}
