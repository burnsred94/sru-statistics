import { Injectable } from '@nestjs/common';
import { StatisticService } from '../statistic/statistic.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CronService {
  constructor(private readonly statisticService: StatisticService) {}

  // @Cron(CronExpression.EVERY_DAY_AT_1AM, {
  //   timeZone: 'Europe/Moscow',
  // })
  // async updateKey() {
  //   await this.statisticService.cronUpdate();
  // }
}
