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
import { ArticleGateway } from './gateways';
import { SenderIoEvent, TownsDestructor } from './utils';
import { UtilsModule } from '../../utils';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Article.name, schema: ArticleSchema }]),
    FetchModule,
    UtilsModule,
    KeysModule,
    PvzModule,
    EventEmitterModule.forRoot({ global: true, maxListeners: 10, verboseMemoryLeak: true }),
  ],
  controllers: [ArticleController],
  providers: [
    ArticleService,
    CreateArticleStrategy,
    ArticleRepository,
    JwtStrategy,
    ArticleGateway,
    TownsDestructor,
    SenderIoEvent,
  ],
  exports: [ArticleService],
})
export class ArticleModule { }

