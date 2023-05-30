import { Module } from '@nestjs/common';
import { DatabaseModule } from './modules/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { StatisticModule } from './modules/statistic/statistic.module';
import { CronModule } from './modules/cron/cron.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtOptions } from './modules/configs/jwt.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    StatisticModule,
    CronModule,
    JwtModule.registerAsync(jwtOptions),
    PassportModule,
  ],
})
export class AppModule {}
