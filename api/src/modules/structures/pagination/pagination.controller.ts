import { Body, Controller, HttpStatus, Logger, Put, Res, UseGuards } from "@nestjs/common";
import { PaginationService } from "./pagination.service";
import { UpdatePaginationDto } from "./dto";
import { Response } from "express";
import { ApiAcceptedResponse } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/modules/auth";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { PaginationDocument } from "./schemas";
import { Types } from "mongoose";


@Controller('pagination')
export class PaginationController {
    protected readonly logger = new Logger(PaginationController.name);

    constructor(
        private readonly paginationService: PaginationService,
        private readonly eventEmitter: EventEmitter2
    ) { };


    @ApiAcceptedResponse({ description: 'Update pagination from article' })
    @UseGuards(JwtAuthGuard)
    @Put('update')
    async update(@Body() dto: UpdatePaginationDto, @Res() response: Response) {
        try {
            let request: PaginationDocument;

            dto.article_id = new Types.ObjectId(dto.article_id);

            const pagination = await this.paginationService.findByArticleId(dto.article_id);

            if (pagination) {
                request = await this.paginationService.update(dto.article_id, dto);
            } else {
                request = await this.paginationService.create(dto);
                await this.eventEmitter.emitAsync('pagination.create', { pagination_id: request._id, article_id: request.article_id });
            }

            return response.status(HttpStatus.OK).send({
                data: request,
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