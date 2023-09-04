import { IsNumber, IsString } from "class-validator";
import { Types } from "mongoose";

export class UpdatePaginationDto {
    @IsString()
    _id: Types.ObjectId;

    @IsNumber()
    key_limit: number;

    @IsNumber()
    page: number;
}