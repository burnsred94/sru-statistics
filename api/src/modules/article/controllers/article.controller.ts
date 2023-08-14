import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Logger,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiAcceptedResponse } from '@nestjs/swagger';
import { AddKeyDto, CreateArticleDto, RemoveKeyDto, RemoveArticleDto } from '../dto';
import { CurrentUser, JwtAuthGuard, User } from 'src/modules';
import { ArticleService } from '../services';
import { Response } from 'express';
import { initArticleMessage } from 'src/constatnts';
import { FetchProvider } from 'src/modules/fetch';

@Controller('v1')
export class ArticleController {
  protected readonly logger = new Logger(ArticleController.name);

  constructor(
    private readonly articleService: ArticleService,
    private readonly fetchProvider: FetchProvider,
  ) { }

  @ApiAcceptedResponse({ description: 'Create Statistic' })
  @UseGuards(JwtAuthGuard)
  @Post('create')
  async create(
    @CurrentUser() user: User,
    @Body() data: CreateArticleDto,
    @Res() response: Response,
  ) {
    try {
      const productNameData = await this.fetchProvider.fetchArticleName(data.article);

      // if (!productNameData.product_name && !productNameData.product_url)
      //   throw new BadRequestException(`Такого артикула не существует: ${data.article}`);

      const create = await this.articleService.create(data, user, productNameData)

      if (create) {
        const initArticle = initArticleMessage(data.article, create);
        return response.status(HttpStatus.OK).send({
          data: { message: initArticle },
          error: [],
          status: response.statusCode,
        });
      }

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
  async addKeys(@Body() dto: AddKeyDto, @CurrentUser() user: User, @Res() response: Response) {
    try {
      const addKey = await this.articleService.addKeys(dto, user);

      if (addKey) {
        const initArticle = initArticleMessage(addKey.article, addKey, addKey.key_length);
        return response.status(HttpStatus.OK).send({
          status: HttpStatus.OK,
          data: { message: initArticle },
          errors: [],
        });
      }
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

      if (remove) {
        const initArticle = initArticleMessage(remove.article, remove);
        return response.status(HttpStatus.OK).send({
          status: HttpStatus.OK,
          data: { message: initArticle },
          errors: [],
        });
      }
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
  async removeKey(@Body() dto: RemoveKeyDto, @CurrentUser() user: User, @Res() response: Response) {
    try {
      const remove = await this.articleService.removeKey(dto, user);

      if (remove) {
        const initArticle = initArticleMessage(remove.article, remove, remove.key);
        return response.status(HttpStatus.OK).send({
          status: HttpStatus.OK,
          data: { message: initArticle },
          errors: [],
        });
      }

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
