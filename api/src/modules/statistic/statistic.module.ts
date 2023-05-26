import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Statistic, StatisticSchema } from './schemas/statistics.schema';
import { Article, ArticleSchema } from './schemas/article.schema';
import { Keys, KeysSchema } from './schemas/keys.schema';
import { Cities, CitiesSchema } from './schemas/cities.schema';
import {
  ArticleRepository,
  KeysRepository,
  StatisticRepository,
} from './repositories';
import { StatisticProvider } from './providers/statistic.provider';
import { StatisticController } from './statistic.controller';
import { StatisticService } from './statistic.service';
import { GotModule } from '@t00nday/nestjs-got';
import { FetchProvider } from './providers/fetch.provider';
import { Pwz, PwzSchema } from './schemas/pwz.schema';
import { PwzRepository } from './repositories/pwz.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Statistic.name, schema: StatisticSchema },
      { name: Article.name, schema: ArticleSchema },
      { name: Keys.name, schema: KeysSchema },
      { name: Cities.name, schema: CitiesSchema },
      { name: Pwz.name, schema: PwzSchema },
    ]),
    GotModule,
  ],
  providers: [
    StatisticRepository,
    ArticleRepository,
    KeysRepository,
    StatisticProvider,
    StatisticService,
    FetchProvider,
    PwzRepository,
  ],
  controllers: [StatisticController],
})
export class StatisticModule {}
