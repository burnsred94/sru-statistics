import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { StatisticService } from './statistic.service';
import { CreateStatisticDto } from './dto';
import { Response, response } from 'express';
import { NOT_FIND_ERROR } from 'src/constatnts/errors.constants';
import { FindDataDto } from './dto/find-data.dto';
import { AddKeysDto } from './dto/add-keys.dto';
import { RemoveKeyDto } from './dto/remove-key.dto';

@Controller('v1')
export class StatisticController {
  protected readonly logger = new Logger(StatisticController.name);

  constructor(private readonly statisticService: StatisticService) { }

  @Post('create')
  async create(@Body() data: CreateStatisticDto) {
    return await this.statisticService.create(data);
  }

  @Get('get-statistic/:id')
  async getStatistic(@Param('id') id) {
    return await this.statisticService.getOne(id);
  }

  @Post('find-by-city')
  async findArticleByCity(
    @Body() data: FindDataDto,
    @Res() response: Response,
  ) {
    try {
      const find = await this.statisticService.findByCity(data);
      return response.status(HttpStatus.OK).send({
        status: HttpStatus.OK,
        data: find,
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

  @Post('add-key-by-article-from-city')
  async addKeyByArticleFromCity(
    @Body() data: AddKeysDto,
    @Res() response: Response,
  ) {
    try {
      const addKey = await this.statisticService.addKeyByArticleFromCity(data);
      return response.status(HttpStatus.CREATED).send({
        status: HttpStatus.CREATED,
        data: addKey,
        error: [],
      });
    } catch (error) {
      this.logger.error(error);
    }
  }

  @Delete('remove-article')
  async removeArticle(@Body() data, @Res() response: Response) {
    try {
      const remove = await this.statisticService.removeArticle(data);

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

  @Delete('remove-key')
  async removeKey(@Body() data: RemoveKeyDto, @Res() response: Response) {
    try {
      const removeKey = await this.statisticService.removeKey(data);
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
}
