import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ArticleService } from '../article';
// CronExpression.EVERY_DAY_AT_1AM
@Injectable()
export class CronService {
  constructor(private readonly articleService: ArticleService) {}

  // @Cron(CronExpression.EVERY_MINUTE, {
  //   timeZone: 'Europe/Moscow',
  // })
  // async updateKey() {
  //   await this.articleService.cronUpdate();
  // }
}
