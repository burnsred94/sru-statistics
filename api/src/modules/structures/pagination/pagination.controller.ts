import { Body, Controller, HttpStatus, Logger, Put, Res, UseGuards } from "@nestjs/common";
import { PaginationService } from "./pagination.service";
import { UpdatePaginationDto } from "./dto";
import { Response } from "express";
import { ApiAcceptedResponse } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/modules/auth";


@Controller('pagination')
export class PaginationController {
    protected readonly logger = new Logger(PaginationController.name);

    constructor(private readonly paginationService: PaginationService) { };


    @ApiAcceptedResponse({ description: 'Update pagination from article' })
    @UseGuards(JwtAuthGuard)
    @Put('update')
    async update(@Body() dto: UpdatePaginationDto, @Res() response: Response) {
        try {
            const update = await this.paginationService.update(dto._id, dto);

            return response.status(HttpStatus.OK).send({
                data: update,
                error: [],
                status: response.statusCode,
            });
        } catch (error) {
            this.logger.error(error.message);
            return response.status(HttpStatus.OK).send({
                data: [],
                error: [{ message: error.message }],
                status: response.statusCode,
            });
        }
    }
}