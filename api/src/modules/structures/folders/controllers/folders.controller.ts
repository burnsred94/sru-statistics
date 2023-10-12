import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    HttpStatus,
    Logger,
    Param,
    Post,
    Put,
    Query,
    Res,
    UseGuards,
} from '@nestjs/common';
import { FolderService } from '../services';
import { Response } from 'express';
import { CurrentUser, JwtAuthGuard, User } from 'src/modules/auth';
import { ApiAcceptedResponse } from '@nestjs/swagger';
import {
    AddManyFolderDto,
    CreateFolderDto,
    FolderUpdateDto,
    GetListDto,
    GetOneFolderDto,
    RemoveFolderDto,
    RemovedKeysInFolderDto,
} from '../dto';
import { TransformMongoIdPipe } from 'src/pipes';
import { HydratedDocument, Types } from 'mongoose';
import { DUPLICATE_NAME } from '../constants';
import { FolderDocument } from '../schemas';

@Controller('keys-folders')
export class FoldersController {
    protected readonly logger = new Logger(FoldersController.name);

    constructor(private readonly folderService: FolderService) { }

    @Post('new-folder')
    @UseGuards(JwtAuthGuard)
    @ApiAcceptedResponse({ description: 'Create new folder' })
    async create(
        @Body() dto: CreateFolderDto,
        @Res() response: Response,
        @CurrentUser() user: User,
        @Query('duplicate') duplicate: string,
    ) {
        try {
            let result: HydratedDocument<FolderDocument>;
            const control = JSON.parse(duplicate);

            if (control) {
                const checkDuplicate = await this.folderService.findOne({
                    user,
                    article_id: dto.article_id,
                    name: dto.name,
                });

                const keys = checkDuplicate?.keys ? checkDuplicate.keys as Types.ObjectId[] : [];

                result = await this.folderService.createDuplicate({ ...dto, keys }, user);
            } else {
                const checkDuplicate = await this.folderService.findOne({
                    user,
                    article_id: dto.article_id,
                    name: dto.name,
                });
                if (checkDuplicate) throw new BadRequestException(DUPLICATE_NAME);
                result = await this.folderService.create(dto, user);
            }

            response.status(HttpStatus.CREATED).send({
                data: result,
                status: HttpStatus.OK,
                errors: [],
            });
        } catch (error) {
            this.logger.error(error.message);
            response.status(HttpStatus.OK).send({
                data: [],
                status: error.status,
                errors: [
                    {
                        message: error.message,
                    },
                ],
            });
        }
    }

    @Post('get-list/:article')
    @UseGuards(JwtAuthGuard)
    @ApiAcceptedResponse({ description: 'Get many folders from user' })
    async getAll(
        @Param('article', new TransformMongoIdPipe()) article: Types.ObjectId,
        @Res() response: Response,
        @Query('search') search: string,
        @CurrentUser() user: User,
        @Body() dto: GetListDto,
    ) {
        try {
            if (!article) throw new BadRequestException(`Incorrect article parameter: ${article}`);

            const result = await this.folderService.findAll(user, article, dto, { search });

            response.status(HttpStatus.OK).send({
                data: result,
                errors: [],
                status: HttpStatus.OK,
            });
        } catch (error) {
            this.logger.error(error);
            response.status(HttpStatus.OK).send({
                data: [],
                errors: [
                    {
                        message: error.message,
                    },
                ],
                status: HttpStatus.OK,
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
        @CurrentUser() user: User,
    ) {
        try {
            if (!id) throw new BadRequestException(`Incorrect article parameter: ${id}`);

            const result = await this.folderService.findOne(
                { _id: id, user },
                { sort: sort, search, period: dto.period, city, pagination: dto.pagination },
            );

            response.status(HttpStatus.OK).send({
                data: result,
                errors: [],
                status: HttpStatus.OK,
            });
        } catch (error) {
            this.logger.error(error);
            response.status(HttpStatus.OK).send({
                data: [],
                errors: [
                    {
                        message: error.message,
                    },
                ],
                status: HttpStatus.OK,
            });
        }
    }

    @Post('added-many-folders')
    @UseGuards(JwtAuthGuard)
    @ApiAcceptedResponse({ description: 'Add many keys from folder' })
    async addedManyFolder(
        @Body() dto: AddManyFolderDto,
        @Res() response: Response,
        @CurrentUser() user: User,
    ) {
        try {
            const result = await this.folderService.addedManyFolderKeys(dto, user);

            response.status(HttpStatus.OK).send({
                data: result,
                errors: [],
                status: HttpStatus.OK,
            });
        } catch (error) {
            this.logger.error(error);
            response.status(HttpStatus.OK).send({
                data: [],
                errors: [
                    {
                        message: error.message,
                    },
                ],
                status: HttpStatus.OK,
            });
        }
    }

    @Delete('removed-keys-in-folder')
    @UseGuards(JwtAuthGuard)
    @ApiAcceptedResponse({ description: 'Removed keys from folder' })
    async removedKeysInFolder(
        @Body() dto: RemovedKeysInFolderDto,
        @Res() response: Response,
        @CurrentUser() user: User,
    ) {
        try {
            const result = await this.folderService.removedManyKeys(dto, user);

            response.status(HttpStatus.OK).send({
                data: result,
                errors: [],
                status: HttpStatus.OK,
            });
        } catch (error) {
            this.logger.error(error);
            response.status(HttpStatus.OK).send({
                data: [],
                errors: [
                    {
                        message: error.message,
                    },
                ],
                status: HttpStatus.OK,
            });
        }
    }

    @Delete('remove-folder')
    @UseGuards(JwtAuthGuard)
    @ApiAcceptedResponse({ description: 'Removed keys from folder' })
    async removeFolder(
        @Body() dto: RemoveFolderDto,
        @Res() response: Response,
        @CurrentUser() user: User,
    ) {
        try {
            const result = await this.folderService.removeFolder(dto, user);

            response.status(HttpStatus.OK).send({
                data: result,
                errors: [],
                status: HttpStatus.OK,
            });
        } catch (error) {
            this.logger.error(error);
            response.status(HttpStatus.OK).send({
                data: [],
                errors: [
                    {
                        message: error.message,
                    },
                ],
                status: HttpStatus.OK,
            });
        }
    }

    @Put('update/:id')
    @UseGuards(JwtAuthGuard)
    @ApiAcceptedResponse({ description: 'Rename folder' })
    async renameFolder(
        @Param('id', new TransformMongoIdPipe()) id: string,
        @Res() response: Response,
        @Body() dto: FolderUpdateDto,
        @CurrentUser() user: User,
    ) {
        try {
            const checkDuplicate = await this.folderService.findOne({
                user,
                article_id: dto.article_id,
                name: dto.name,
            });

            if (checkDuplicate) throw new BadRequestException(DUPLICATE_NAME);

            const result = await this.folderService.update({ _id: id, ...dto });

            response.status(HttpStatus.OK).send({
                data: result,
                errors: [],
                status: HttpStatus.OK,
            });
        } catch (error) {
            this.logger.error(error);
            response.status(HttpStatus.OK).send({
                data: [],
                errors: [
                    {
                        message: error.message,
                    },
                ],
                status: HttpStatus.OK,
            });
        }
    }
}
