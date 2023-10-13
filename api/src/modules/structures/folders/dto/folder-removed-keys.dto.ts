import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';
import { map } from 'lodash';
import { Types } from 'mongoose';

export class RemovedKeysInFolderDto {
  @IsString()
  id_folder: Types.ObjectId;

  @IsString({ each: true })
  ids_keys: Types.ObjectId[];
}
