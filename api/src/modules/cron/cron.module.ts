import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ArticleModule } from '../article';

@Module({
  imports: [ScheduleModule.forRoot(), ArticleModule],
  providers: [CronService],
})
export class CronModule {}
