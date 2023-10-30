import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FetchModule } from '../../fetch/fetch.module';
import { JwtStrategy } from '../../auth';
import { KeysModule } from '../keys';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PvzModule } from '../pvz';
import { Article, ArticleSchema } from './schemas';
import { ArticleController } from './controllers';
import { ArticleService } from './services';
import { ArticleRepository } from './repositories';
import { PaginationModule } from '../pagination';
import { ArticleBuilder } from './services/builders/article.builder';
import { ProductsIntegrationModule, ProfilesIntegrationModule } from 'src/modules/integrations';
import { UtilsModule } from 'src/modules/utils';
import { EventsModule } from 'src/modules/lib/events/event.module';
import { ValidationArticlePipe } from './pipe';
import { HttpModule } from '@nestjs/axios';
import { ArticleVisitor } from './services/visitors';
import { MetricsModule } from '../metrics/metrics.module';
import { ArticleMetricsService } from './services/metrics'

const STRUCTURES = [PaginationModule, KeysModule, PvzModule];
const INTEGRATIONS = [ProfilesIntegrationModule, ProductsIntegrationModule];

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Article.name, schema: ArticleSchema }]),
    EventEmitterModule.forRoot({ global: true, maxListeners: 10, verboseMemoryLeak: true }),
    FetchModule,
    MetricsModule,
    HttpModule,
    EventsModule,
    UtilsModule,
    ...INTEGRATIONS,
    ...STRUCTURES,
  ],
  controllers: [ArticleController],
  providers: [
    ArticleService,
    ArticleBuilder,
    ArticleVisitor,
    ArticleRepository,
    ArticleMetricsService,
    ValidationArticlePipe,
    JwtStrategy,
  ],
  exports: [ArticleService, ArticleMetricsService],
})
export class ArticleModule { }
