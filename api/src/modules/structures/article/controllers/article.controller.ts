import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiAcceptedResponse } from '@nestjs/swagger';
import {
  AddKeyDto,
  CreateArticleDto,
  RemoveKeyDto,
  RemoveArticleDto,
  RefreshArticleDto,
} from '../dto';
import { CurrentUser, JwtAuthGuard, User } from 'src/modules';
import { ArticleService } from '../services';
import { Response } from 'express';
import { initArticleMessage } from 'src/constatnts';
import { Types } from 'mongoose';
import { RabbitMqResponser } from 'src/modules/rabbitmq/decorators';
import { RmqExchanges, RmqServices } from 'src/modules/rabbitmq/exchanges';
import { StatisticsGetArticlesRMQ } from 'src/modules/rabbitmq/contracts/statistics';
import { ValidationArticlePipe } from '../pipe';
import { MessagesEvent } from 'src/interfaces';

@Controller('v1')
export class ArticleController {
  protected readonly logger = new Logger(ArticleController.name);

  constructor(private readonly articleService: ArticleService) { }

  @ApiAcceptedResponse({ description: 'Create Statistic' })
  @UseGuards(JwtAuthGuard)
  @Post('create')
  async createArticle(
    @CurrentUser() user: User,
    @Body(new ValidationArticlePipe()) data: CreateArticleDto,
    @Res() response: Response,
  ) {
    try {
      const result = await this.articleService.create(data, user);

      if (result) {
        const message = initArticleMessage(data.article, result);
        return response.status(HttpStatus.OK).send({
          data: { message },
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
      const result = await this.articleService.addKeywords(dto, user);

      if (result) {
        const initArticle = initArticleMessage(result.article, result);
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
        const initArticle = initArticleMessage(
          { articles: remove },
          { event: MessagesEvent.DELETE_ARTICLES },
        );
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
  @Get('user-articles')
  async userArticles(
    @CurrentUser() user: User,
    @Query('search') search: string,
    @Query('sort') sort: string,
    @Res() response: Response,
  ) {
    try {
      const articles = await this.articleService.articles(user, { search, sort });

      return response.status(HttpStatus.OK).send({
        data: articles,
        error: [],
        status: HttpStatus.OK,
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
  async removeKey(@Body() dto: RemoveKeyDto, @CurrentUser() user: User, @Res() response: Response) {
    try {
      const remove = await this.articleService.removeKeywords(dto, user);

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

  @ApiAcceptedResponse({ description: 'Remove key' })
  @UseGuards(JwtAuthGuard)
  @Post('article/:id')
  async getArticle(
    @Param('id') id: Types.ObjectId,
    @Body() dto,
    @Query('search') search: string,
    @Query('sort') sort: { frequency: number },
    @Query('city') city: string,
    @Res() response: Response,
  ) {
    try {
      const getArticle = await this.articleService.findArticle(id, { ...dto, search, sort, city });
      return response.status(HttpStatus.OK).send({
        status: HttpStatus.OK,
        data: getArticle,
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


  @RabbitMqResponser({
    exchange: RmqExchanges.STATISTICS,
    routingKey: StatisticsGetArticlesRMQ.routingKey,
    queue: StatisticsGetArticlesRMQ.queue,
    currentService: RmqServices.STATISTICS,
  })
  async getDataUpload(payload: StatisticsGetArticlesRMQ.Payload) {
    try {
      return { articles: await this.articleService.getArticlesUpload(payload) };
    } catch (error) {
      this.logger.error(error.message);
    }
  }
}
