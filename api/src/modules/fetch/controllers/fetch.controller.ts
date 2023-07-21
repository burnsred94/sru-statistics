import {
    Body,
    Controller,
    HttpStatus,
    Logger,
    Post,
    Res,
} from '@nestjs/common';
import { FetchProvider } from '../provider';
import { GetPositionDto } from '../dto';
import { Response } from 'express';

@Controller('fetch')
export class FetchController {
    private readonly logger = new Logger(FetchController.name);

    constructor(private readonly fetchProvider: FetchProvider) { }

    @Post('get-position')
    async getPositionWidgets(
        @Body() dto: GetPositionDto,
        @Res() response: Response,
    ) {
        try {
            const data = await this.fetchProvider.getPositionWidget(dto);

            return response.status(HttpStatus.OK).send({
                status: HttpStatus.OK,
                data: data,
                error: [],
            });
        } catch (error) {
            this.logger.warn(error.message);
            return response.status(HttpStatus.OK).send({
                status: error.status,
                error: [{ message: error.message }],
                data: [],
            });
        }
    }
}
