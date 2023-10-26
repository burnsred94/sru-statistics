import { Transform } from "class-transformer";
import { IsArray } from "class-validator";
import { Types } from "mongoose";
import { keywordsUniq } from "../../utils";

export class AddKeyDto {
  @Transform((data) => {
    data.value = new Types.ObjectId(data.value)
    data.obj.articleId = new Types.ObjectId(data.obj.articleId)
    return data.value
  })
  articleId: Types.ObjectId;

  @Transform((data) => keywordsUniq(data.obj.keys))
  @IsArray()
  keys: string[];
}
