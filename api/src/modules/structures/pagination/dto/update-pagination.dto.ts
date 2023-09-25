import { Transform } from "class-transformer";
import { IsNumber } from "class-validator";
import { Types } from "mongoose";

export class UpdatePaginationDto {

    @Transform(({ value }) => new Types.ObjectId(value))
    article_id: Types.ObjectId;

    @IsNumber()
    key_limit: number;

    @IsNumber()
    page: number;
}