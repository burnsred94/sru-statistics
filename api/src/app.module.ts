import { Module } from '@nestjs/common';
import { DatabaseModule } from './modules/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { StatisticModule } from './modules/statistic/statistic.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { GotModule } from '@t00nday/nestjs-got';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    StatisticModule,
    TasksModule,
  ],
})
export class AppModule {}
