import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Keys, KeysSchema } from './schemas';
import { KeysRepository } from './repositories';
import { KeysService } from './services';
import { PvzModule } from '../pvz';
import { KeysProcessor } from './processors';
import { BullModule } from '@nestjs/bull';
import { RedisQueueEnum } from 'src/redis-queues';
import { AverageModule } from '../average';
import { MockGenerator } from './utils';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Keys.name, schema: KeysSchema }]),
    PvzModule,
    AverageModule,
    BullModule.registerQueue({
      name: RedisQueueEnum.KEYS_QUEUE,
      defaultJobOptions: {
        attempts: 1,
        removeOnFail: true,
      },
    }),
  ],
  providers: [KeysRepository, KeysService, KeysProcessor, MockGenerator],
  exports: [KeysService, MockGenerator],
})
export class KeysModule { }
