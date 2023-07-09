import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Logger,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiAcceptedResponse } from '@nestjs/swagger';
import {
  AddKeyDto,
  CreateArticleDto,
  RemoveKeyDto,
  RemoveArticleDto,
  ArticlePaginationDto,
} from '../dto';
import { CurrentUser, JwtAuthGuard, User } from 'src/modules';
import { ArticleService } from '../services';
import { Response, Request } from 'express';
import { initArticleMessage } from 'src/constatnts';

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
    @Req() request: Request,
    @Res() response: Response,
  ) {
    try {
      process.nextTick(
        async () =>
          await this.articleService.create(data, user, request.cookies),
      );

      const initArticle = initArticleMessage(data.article);
      return response.status(HttpStatus.OK).send({
        data: { message: initArticle },
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

  @ApiAcceptedResponse({ description: 'Added keys by article' })
  @UseGuards(JwtAuthGuard)
  @Post('add-key-by-article')
  async addKeys(
    @Body() dto: AddKeyDto,
    @CurrentUser() user: User,
    @Res() response: Response,
  ) {
    try {
      const addKey = await this.articleService.addKeys(dto, user);
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

  @ApiAcceptedResponse({ description: 'Send length articles' })
  @UseGuards(JwtAuthGuard)
  @Get('/check-articles')
  async checkArticles(@CurrentUser() user: User, @Res() response: Response) {
    try {
      const checkData = await this.articleService.checkData(user);

      return response.status(HttpStatus.OK).send({
        data: checkData,
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

  @ApiAcceptedResponse({ description: 'Remove article' })
  @UseGuards(JwtAuthGuard)
  @Delete('remove-article')
  async removeArticle(
    @Body() dto: RemoveArticleDto,
    @CurrentUser() user: User,
    @Res() response: Response,
  ) {
    try {
      const remove = await this.articleService.removeArticle(dto, user);

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
}
