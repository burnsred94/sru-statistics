import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FetchModule } from '../../fetch/fetch.module';
import { JwtStrategy } from '../../auth';
import { KeysModule } from '../keys';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PvzModule } from '../pvz';
import { Article, ArticleSchema } from './schemas';
import { ArticleController } from './controllers';
import { ArticleService, CreateArticleStrategy } from './services';
import { ArticleRepository } from './repositories';
import { TownsDestructor } from './utils';
import { UtilsModule } from '../../utils';
import { PaginationModule } from '../pagination';
import { ArticleBuilder } from './services/builders/article.builder';
import { ProductsIntegrationModule, ProfilesIntegrationModule } from 'src/modules/integrations';

const STRUCTURES = [PaginationModule, KeysModule, PvzModule];
const INTEGRATIONS = [ProfilesIntegrationModule, ProductsIntegrationModule]

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Article.name, schema: ArticleSchema }]),
    EventEmitterModule.forRoot({ global: true, maxListeners: 10, verboseMemoryLeak: true }),
    FetchModule,
    UtilsModule,
    ...INTEGRATIONS,
    ...STRUCTURES,
  ],
  controllers: [ArticleController],
  providers: [
    ArticleService,
    ArticleBuilder,
    CreateArticleStrategy,
    ArticleRepository,
    JwtStrategy,
    TownsDestructor,
  ],
  exports: [ArticleService],
})
export class ArticleModule { }
