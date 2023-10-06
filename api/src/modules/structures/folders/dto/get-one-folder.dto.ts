import { IsString } from "class-validator";

export class GetOneFolderDto {

    @IsString({ each: true })
    period: Array<string>
}