import { Module } from '@nestjs/common';
import { DatabaseModule } from './modules/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { CronModule } from './modules/cron/cron.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtOptions } from './configs/jwt.config';
import { ArticleModule } from './modules/article/article.module';
import { FetchModule } from './modules/fetch/fetch.module';
import { KeysModule } from './modules/keys/keys.module';
import { PvzModule } from './modules/pvz/pvz.module';
import { PeriodsModule } from './modules/periods/periods.module';
import { AverageModule } from './modules/average/average.module';
import { RmqModule } from './modules/rabbitmq/rabbitmq.module';
import { RmqExchanges } from './modules/rabbitmq/exchanges';
import { RabbitRpcParamsFactory } from '@golevelup/nestjs-rabbitmq';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    CronModule,
    JwtModule.registerAsync(jwtOptions),
    PassportModule,
    ArticleModule,
    FetchModule,
    KeysModule,
    PvzModule,
    PeriodsModule,
    AverageModule,
  ],
})
export class AppModule {}
