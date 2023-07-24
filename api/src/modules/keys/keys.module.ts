import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Keys, KeysSchema } from './schemas';
import { KeysRepository } from './repositories';
import { KeysPvzService, KeysService } from './services';
import { PvzModule } from '../pvz';
import { AverageModule } from '../average';
import { MockGenerator } from './utils';
import { RmqModule } from '../rabbitmq/rabbitmq.module';
import { RmqExchanges } from '../rabbitmq/exchanges';
import { KeysController } from './controllers';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Keys.name, schema: KeysSchema }]),
    PvzModule,
    RmqModule.register({ exchanges: [RmqExchanges.STATISTICS] }),
    AverageModule,
  ],
  providers: [KeysRepository, KeysService, MockGenerator, KeysPvzService],
  exports: [KeysService, MockGenerator],
  controllers: [KeysController],
})
export class KeysModule {}
