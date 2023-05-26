import { Body, Controller, Get, Logger, Param, Post } from '@nestjs/common';
import { StatisticService } from './statistic.service';
import { CreateStatisticDto } from './dto';

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
}
