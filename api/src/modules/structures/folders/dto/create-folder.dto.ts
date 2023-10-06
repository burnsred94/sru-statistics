import { Transform } from "class-transformer";
import { IsArray, IsMongoId, IsNotEmpty, IsString } from "class-validator";
import { Types } from "mongoose";

export class CreateFolderDto {

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @Transform((data) => data.obj.article_id = new Types.ObjectId(data.value))
    article_id: Types.ObjectId;

    @IsArray()
    @IsMongoId({ each: true })
    keys?: Types.ObjectId[];
} 