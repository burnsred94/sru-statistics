import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Article, ArticleSchema } from './schemas';
import { FetchModule } from '../fetch/fetch.module';
import { ArticleController } from './controllers';
import { ArticleService } from './services';
import { ArticleRepository } from './repositories';
import { JwtStrategy } from '../auth';
import { KeysModule } from '../keys';
import { ArticleProcessor } from './processors';
import { BullModule } from '@nestjs/bull';
import { RedisQueueEnum } from 'src/redis-queues';
import { ArticleGateway } from './gateways/article.gateway';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Article.name, schema: ArticleSchema },
    ]),
    FetchModule,
    KeysModule,
    EventEmitterModule.forRoot(),
    BullModule.registerQueue({
      name: RedisQueueEnum.ARTICLE_QUEUE,
      defaultJobOptions: {
        attempts: 1,
        removeOnFail: true,
      },
    }),
  ],
  controllers: [ArticleController],
  providers: [
    ArticleService,
    ArticleRepository,
    JwtStrategy,
    ArticleProcessor,
    ArticleGateway,
  ],
  exports: [ArticleService],
})
export class ArticleModule { }
