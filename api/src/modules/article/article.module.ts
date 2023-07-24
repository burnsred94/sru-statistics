import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FetchModule } from '../fetch/fetch.module';
import { JwtStrategy } from '../auth';
import { KeysModule } from '../keys';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PvzModule } from '../pvz';
import { Article, ArticleSchema } from './schemas';
import { ArticleController } from './controllers';
import { ArticleService } from './services';
import { ArticleRepository } from './repositories';
import { ArticleGateway } from './gateways';
import { TownsDestructor } from './utils';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Article.name, schema: ArticleSchema }]),
    FetchModule,
    KeysModule,
    PvzModule,
    EventEmitterModule.forRoot({ global: true, maxListeners: 100 }),
  ],
  controllers: [ArticleController],
  providers: [ArticleService, ArticleRepository, JwtStrategy, ArticleGateway, TownsDestructor],
  exports: [ArticleService],
})
export class ArticleModule {}
