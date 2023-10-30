import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class RemoveKeyDto {
  @Transform(data => {
    data.value = new Types.ObjectId(data.value);
    data.obj.articleId = new Types.ObjectId(data.obj.articleId);
    return data.value;
  })
  articleId: Types.ObjectId;

  @IsNotEmpty()
  @IsString({ each: true })
  keysId: Types.ObjectId[];
}
