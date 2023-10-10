import { BadRequestException, Body, Controller, Delete, Get, HttpStatus, Logger, Param, Post, Query, Res, UseGuards, ValidationPipe } from '@nestjs/common';
import { FolderService } from '../services';
import { Response } from 'express';
import { CurrentUser, JwtAuthGuard, User } from 'src/modules/auth';
import { ApiAcceptedResponse } from '@nestjs/swagger';
import { AddManyFolderDto, CreateFolderDto, GetOneFolderDto, RemoveFolderDto, RemovedKeysInFolderDto } from '../dto';
import { TransformMongoIdPipe } from 'src/pipes';
import { Types } from 'mongoose';

@Controller('keys-folders')
export class FoldersController {
    protected readonly logger = new Logger(FoldersController.name);

    constructor(private readonly folderService: FolderService) { }

    @Post('new-folder')
    @UseGuards(JwtAuthGuard)
    @ApiAcceptedResponse({ description: 'Create new folder' })
    async create(@Body() dto: CreateFolderDto, @Res() response: Response, @CurrentUser() user: User) {
        try {

            const checkDuplicate = await this.folderService.findOne({ user, article_id: dto.article_id, name: dto.name });

            if (checkDuplicate) throw new BadRequestException('У вас уже есть папка с таким названием');

            const result = await this.folderService.create(dto, user);

            response.status(HttpStatus.CREATED).send({
                data: result,
                status: HttpStatus.OK,
                errors: [],
            })
        } catch (error) {
            this.logger.error(error.message);
            response.status(HttpStatus.OK).send({
                data: [],
                status: error.status,
                errors: [
                    {
                        message: error.message
                    }
                ]
            })
        }
    }

    @Get('get-list/:article')
    @UseGuards(JwtAuthGuard)
    @ApiAcceptedResponse({ description: 'Get many folders from user' })
    async getAll(@Param('article', new TransformMongoIdPipe()) article: Types.ObjectId, @Res() response: Response, @CurrentUser() user: User) {
        try {
            if (!article) throw new BadRequestException(`Incorrect article parameter: ${article}`);

            const result = await this.folderService.findAll(user, article);

            response.status(HttpStatus.OK).send({
                data: result,
                errors: [],
                status: HttpStatus.OK
            });

        } catch (error) {
            this.logger.error(error);
            response.status(HttpStatus.OK).send({
                data: [],
                errors: [
                    {
                        message: error.message
                    }
                ],
                status: HttpStatus.OK
            });
        }
    }

    @Post('get-one/:id')
    @UseGuards(JwtAuthGuard)
    @ApiAcceptedResponse({ description: 'Get one folder from user' })
    async getOne(
        @Param('id', new TransformMongoIdPipe()) id: Types.ObjectId,
        @Body() dto: GetOneFolderDto,
        @Query('search') search: string,
        @Query('sort') sort: { frequency: number },
        @Query('city') city: string,
        @Res() response: Response,
        @CurrentUser() user: User
    ) {
        try {
            if (!id) throw new BadRequestException(`Incorrect article parameter: ${id}`);

            const result = await this.folderService.findOne(
                { _id: id, user },
                { sort: sort, search, period: dto.period, city, pagination: dto.pagination }
            );

            response.status(HttpStatus.OK).send({
                data: result,
                errors: [],
                status: HttpStatus.OK
            });
        } catch (error) {
            this.logger.error(error);
            response.status(HttpStatus.OK).send({
                data: [],
                errors: [
                    {
                        message: error.message
                    }
                ],
                status: HttpStatus.OK
            });
        }
    }

    @Post('added-many-folders')
    @UseGuards(JwtAuthGuard)
    @ApiAcceptedResponse({ description: 'Add many keys from folder' })
    async addedManyFolder(@Body() dto: AddManyFolderDto, @Res() response: Response, @CurrentUser() user: User) {
        try {
            const result = await this.folderService.addedManyFolderKeys(dto, user);

            response.status(HttpStatus.OK).send({
                data: result,
                errors: [],
                status: HttpStatus.OK
            });
        } catch (error) {
            this.logger.error(error);
            response.status(HttpStatus.OK).send({
                data: [],
                errors: [
                    {
                        message: error.message
                    }
                ],
                status: HttpStatus.OK
            });
        }
    }

    @Delete('removed-keys-in-folder')
    @UseGuards(JwtAuthGuard)
    @ApiAcceptedResponse({ description: 'Removed keys from folder' })
    async removedKeysInFolder(@Body() dto: RemovedKeysInFolderDto, @Res() response: Response, @CurrentUser() user: User) {
        try {

            const result = await this.folderService.removedManyKeys(dto, user)

            response.status(HttpStatus.OK).send({
                data: result,
                errors: [],
                status: HttpStatus.OK
            });
        } catch (error) {
            this.logger.error(error);
            response.status(HttpStatus.OK).send({
                data: [],
                errors: [
                    {
                        message: error.message
                    }
                ],
                status: HttpStatus.OK
            });
        }
    }

    @Delete('remove-folder')
    @UseGuards(JwtAuthGuard)
    @ApiAcceptedResponse({ description: 'Removed keys from folder' })
    async removeFolder(@Body() dto: RemoveFolderDto, @Res() response: Response, @CurrentUser() user: User) {
        try {

            const result = await this.folderService.removeFolder(dto, user)

            response.status(HttpStatus.OK).send({
                data: result,
                errors: [],
                status: HttpStatus.OK
            });
        } catch (error) {
            this.logger.error(error);
            response.status(HttpStatus.OK).send({
                data: [],
                errors: [
                    {
                        message: error.message
                    }
                ],
                status: HttpStatus.OK
            });
        }
    }

} 
