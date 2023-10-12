import { Transform } from "class-transformer";
import { IsMongoId, IsString } from "class-validator";
import { Types } from "mongoose";


export class AddNewKeysToFolderDto {

    @Transform(data => (data.obj.article_id = new Types.ObjectId(data.value)))
    @IsMongoId()
    article_id: Types.ObjectId

    @IsString()
    keys: string[];
}