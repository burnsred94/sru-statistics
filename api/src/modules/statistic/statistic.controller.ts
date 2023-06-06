import {
  Body,
  Controller,
  Delete,
  HttpStatus,
  Logger,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { StatisticService } from './statistic.service';
import {
  AddKeysDto,
  CreateStatisticDto,
  FindDataDto,
  RemoveArticleDto,
  RemoveKeyDto,
} from './dto';
import { Response } from 'express';
import { GetOneDto } from './dto/get-one-article.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { User } from '../auth/user';
import { ApiAcceptedResponse, ApiBody } from '@nestjs/swagger';

@Controller('v1')
export class StatisticController {
  protected readonly logger = new Logger(StatisticController.name);

  constructor(private readonly statisticService: StatisticService) { }

  @ApiAcceptedResponse({ description: 'Create Statistic' })
  @UseGuards(JwtAuthGuard)
  @Post('create')
  async create(@CurrentUser() user: User, @Body() data: CreateStatisticDto) {
    return await this.statisticService.create(data, user);
  }

  @ApiAcceptedResponse({ description: 'Find statistics' })
  @UseGuards(JwtAuthGuard)
  @Post('find-by-city')
  async findArticleByCity(
    @CurrentUser() user: User,
    @Body() data: FindDataDto,
    @Res() response: Response,
  ) {
    try {
      const statisticData = await this.statisticService.findByCity(data, user);

      // const mergeStatisticsWithProfile = await this.statisticService.merge(
      //   user,
      //   statisticData,
      // );

      // const resolved = await Promise.all(mergeStatisticsWithProfile);

      // if (resolved) {
      const find = await this.statisticService.findByCity(data, user)
      return response.status(HttpStatus.OK).send({
        status: HttpStatus.OK,
        data: statisticData,
        errors: [],
      });
      // }
    } catch (error) {
      this.logger.error(error);
      const find = await this.statisticService.findByCity(data, user);
      return response.status(HttpStatus.OK).send({
        status: error.status,
        errors: [
          {
            message: error.message,
          },
        ],
        data: find,
      });
    }
  }

  @ApiAcceptedResponse({ description: 'Added key from user-city' })
  @UseGuards(JwtAuthGuard)
  @Post('add-key-by-article-from-city')
  async addKeyByArticleFromCity(
    @CurrentUser() user: User,
    @Body() data: AddKeysDto,
    @Res() response: Response,
  ) {
    try {
      const addKey = await this.statisticService.addKeyByArticleFromCity(
        data,
        user,
      );
      return response.status(HttpStatus.CREATED).send({
        status: HttpStatus.CREATED,
        data: addKey,
        error: [],
      });
    } catch (error) {
      this.logger.error(error);
      return response.status(HttpStatus.OK).send({
        status: error.status,
        data: [],
        errors: [{ message: error.message }],
      });
    }
  }

  @ApiAcceptedResponse({ description: 'Removed article' })
  @UseGuards(JwtAuthGuard)
  @Delete('remove-article')
  async removeArticle(
    @CurrentUser() user: User,
    @Body() data: RemoveArticleDto,
    @Res() response: Response,
  ) {
    try {
      const remove = await this.statisticService.removeArticle(data, user);

      return response.status(HttpStatus.OK).send({
        status: HttpStatus.OK,
        data: {
          message: remove.message,
        },
        errors: [],
      });
    } catch (error) {
      this.logger.error(error);
      return response.status(HttpStatus.OK).send({
        status: error.status,
        errors: [
          {
            message: error.message,
          },
        ],
        data: [],
      });
    }
  }

  @ApiAcceptedResponse({ description: 'Removed key' })
  @UseGuards(JwtAuthGuard)
  @Delete('remove-key')
  async removeKey(
    @CurrentUser() user: User,
    @Body() data: RemoveKeyDto,
    @Res() response: Response,
  ) {
    try {
      const removeKey = await this.statisticService.removeKey(data, user);
      return response.status(HttpStatus.OK).send({
        status: HttpStatus.OK,
        data: {
          message: removeKey,
        },
        errors: [],
      });
    } catch (error) {
      this.logger.error(error);
      return response.status(HttpStatus.OK).send({
        status: error.status,
        errors: [
          {
            message: error.message,
          },
        ],
        data: [],
      });
    }
  }

  @Post('get-one-article')
  async getOneArticle(@Body() dto: GetOneDto, @Res() response: Response) {
    try {
      const getData = await this.statisticService.getOneArticle(dto);

      return response.status(HttpStatus.OK).send({
        status: HttpStatus.OK,
        data: getData[0],
        errors: [],
      });
    } catch (error) {
      this.logger.error(error);
      return response.status(HttpStatus.OK).send({
        status: error.status,
        errors: [
          {
            message: error.message,
          },
        ],
        data: [],
      });
    }
  }
}
