import {
  Body,
  Controller,
  Delete,
  HttpStatus,
  Logger,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiAcceptedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/auth.guard';
import { CurrentUser } from 'src/modules/auth/user.decorator';
import {
  AddKeyDto,
  CreateArticleDto,
  FindByCityDto,
  FindByCityQueryDto,
  RemoveKeyDto,
  UpdateFromProfileDto,
  UpdateStatusDto,
} from '../dto';
import { User } from 'src/modules';
import { ArticleService } from '../services';
import { Response } from 'express';

@Controller('v1')
export class ArticleController {
  protected readonly logger = new Logger(ArticleController.name);

  constructor(private readonly articleService: ArticleService) { }

  @ApiAcceptedResponse({ description: 'Create Statistic' })
  @UseGuards(JwtAuthGuard)
  @Post('create')
  async create(
    @CurrentUser() user: User,
    @Body() data: CreateArticleDto,
    @Res() response: Response,
  ) {
    try {
      const newArticle = await this.articleService.create(data, user);

      return response.status(HttpStatus.OK).send({
        data: newArticle,
        error: [],
        status: response.statusCode,
      });
    } catch (error) {
      this.logger.error(error);
      return response.status(HttpStatus.OK).send({
        data: [],
        error: [{ message: error.message }],
        status: response.statusCode,
      });
    }
  }

  @ApiAcceptedResponse({ description: 'Find by city' })
  @UseGuards(JwtAuthGuard)
  @Post('find-by-city')
  async findByCity(
    @Body() data: FindByCityDto,
    @CurrentUser() user: User,
    @Query() query: FindByCityQueryDto,
    @Res() response: Response,
  ) {
    try {
      const findByCity = await this.articleService.findByCity(
        data,
        user as unknown as number,
        query,
      );

      return response.status(HttpStatus.OK).send({
        status: HttpStatus.OK,
        data: findByCity,
        errors: [],
      });
    } catch (error) {
      this.logger.error(error);
      return response.status(HttpStatus.OK).send({
        data: [],
        error: [{ message: error.message }],
        status: error.statusCode,
      });
    }
  }

  @ApiAcceptedResponse({ description: 'Added keys by article' })
  @UseGuards(JwtAuthGuard)
  @Post('add-key-by-article-from-city')
  async addKeysByCity(
    @Body() dto: AddKeyDto,
    @CurrentUser() user: User,
    @Res() response: Response,
  ) {
    try {
      const addKey = await this.articleService.addKeysByArticle(dto, user);
      return response.status(HttpStatus.OK).send({
        status: HttpStatus.OK,
        data: addKey,
        errors: [],
      });
    } catch (error) {
      this.logger.error(error);
      return response.status(HttpStatus.OK).send({
        data: [],
        error: [{ message: error.message }],
        status: error.statusCode,
      });
    }
  }

  @ApiAcceptedResponse({ description: 'Remove article' })
  @UseGuards(JwtAuthGuard)
  @Delete('remove-article')
  async removeArticle(
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: User,
    @Res() response: Response,
  ) {
    try {
      const remove = await this.articleService.updateStatus(dto, user);

      return response.status(HttpStatus.OK).send({
        status: HttpStatus.OK,
        data: remove,
        errors: [],
      });
    } catch (error) {
      this.logger.error(error);
      return response.status(HttpStatus.OK).send({
        data: [],
        error: [{ message: error.message }],
        status: error.statusCode,
      });
    }
  }

  @ApiAcceptedResponse({ description: 'Remove key' })
  @UseGuards(JwtAuthGuard)
  @Delete('remove-key')
  async removeKey(
    @Body() dto: RemoveKeyDto,
    @CurrentUser() user: User,
    @Res() response: Response,
  ) {
    try {
      const remove = await this.articleService.removeKey(dto, user);

      return response.status(HttpStatus.OK).send({
        status: HttpStatus.OK,
        data: remove,
        errors: [],
      });
    } catch (error) {
      this.logger.error(error);
      return response.status(HttpStatus.OK).send({
        data: [],
        error: [{ message: error.message }],
        status: error.statusCode,
      });
    }
  }

  @ApiAcceptedResponse({ description: 'Update article from profile' })
  @Post('update-from-profile')
  async updateFromProfile(@Body() dto: UpdateFromProfileDto) {
    try {
      const { userId, towns } = dto.data;
      await this.articleService.updateStatsFromProfile(userId, towns);
    } catch (error) {
      this.logger.error(error.message);
    }
  }
}
