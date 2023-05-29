import { Module } from '@nestjs/common';
import { DatabaseModule } from './modules/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { StatisticModule } from './modules/statistic/statistic.module';
import { CronModule } from './modules/cron/cron.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    StatisticModule,
    CronModule,
  ],
})
export class AppModule {}
