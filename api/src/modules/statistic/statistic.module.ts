import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Article, ArticleSchema } from './schemas/article.schema';
import { Keys, KeysSchema } from './schemas/keys.schema';
import { ArticleRepository, KeysRepository } from './repositories';
import { StatisticProvider } from './providers/statistic.provider';
import { StatisticController } from './statistic.controller';
import { StatisticService } from './statistic.service';
import { GotModule } from '@t00nday/nestjs-got';
import { FetchProvider } from './providers/fetch.provider';
import { Pwz, PwzSchema } from './schemas/pwz.schema';
import { PwzRepository } from './repositories/pwz.repository';
import { ArticleProvider } from './providers/article.provider';
import { KeyProvider } from './providers/key.provider';
import { PwzProvider } from './providers/pwz.provider';
import { Period, PeriodSchema } from './schemas/periods.schema';
import { PeriodRepository } from './repositories/periods.repository';
import { JwtStrategy } from '../auth/jwt.strategy';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Article.name, schema: ArticleSchema },
      { name: Keys.name, schema: KeysSchema },
      { name: Pwz.name, schema: PwzSchema },
      { name: Period.name, schema: PeriodSchema },
    ]),
    GotModule,
  ],
  providers: [
    ArticleRepository,
    KeysRepository,
    StatisticProvider,
    StatisticService,
    FetchProvider,
    PwzRepository,
    ArticleProvider,
    KeyProvider,
    PwzProvider,
    PeriodRepository,
    JwtStrategy,
  ],
  controllers: [StatisticController],
  exports: [StatisticService],
})
export class StatisticModule {}
