import { Module } from '@nestjs/common';
import { DatabaseModule } from './modules/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtOptions } from './configs/jwt.config';
import { ArticleModule } from './modules/article/article.module';
import { FetchModule } from './modules/fetch/fetch.module';
import { KeysModule } from './modules/keys/keys.module';
import { PvzModule } from './modules/pvz/pvz.module';
import { PeriodsModule } from './modules/periods/periods.module';
import { AverageModule } from './modules/average/average.module';
import { ScheduleModule } from '@nestjs/schedule';
import { UtilsModule } from './modules/utils/utils.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    ScheduleModule.forRoot(),
    JwtModule.registerAsync(jwtOptions),
    PassportModule,
    ArticleModule,
    FetchModule,
    KeysModule,
    PvzModule,
    PeriodsModule,
    AverageModule,
    UtilsModule,
  ],
})
export class AppModule {}
