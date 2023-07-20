import { Body, Controller, Logger, Post } from "@nestjs/common";
import { FetchProvider } from "../provider";
import { GetPositionDto } from "../dto";

@Controller('fetch')
export class FetchController {
    private readonly logger = new Logger(FetchController.name);

    constructor(private readonly fetchProvider: FetchProvider) { }


    @Post('get-position')
    async getPositionWidgets(@Body() dto: GetPositionDto) {
        return await this.fetchProvider.getPositionWidget(dto);
    }
}