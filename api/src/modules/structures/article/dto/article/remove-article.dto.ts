import { Transform } from 'class-transformer';
import { IsArray } from 'class-validator';
import { TransformMongoId } from '../../utils';
import { map } from 'lodash';
import { Types } from 'mongoose';

export class RemoveArticleDto {
  @Transform(data => {
    data.value = map(data.value, value => TransformMongoId(value));
    data.obj.articleId = map(data.obj.articleId, value => TransformMongoId(value));
    return data.value;
  })
  @IsArray()
  articleId: Types.ObjectId[];
}
