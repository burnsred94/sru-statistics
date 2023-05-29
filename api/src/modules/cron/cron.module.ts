import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { ScheduleModule } from '@nestjs/schedule';
import { StatisticModule } from '../statistic/statistic.module';

@Module({
  imports: [ScheduleModule.forRoot(), StatisticModule],
  providers: [CronService],
})
export class CronModule {}
