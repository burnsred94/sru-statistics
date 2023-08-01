import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Keys, KeysSchema } from './schemas';
import { KeysRepository } from './repositories';
import { KeysPvzService, KeysService } from './services';
import { PvzModule } from '../pvz';
import { AverageModule } from '../average';
import { RmqModule } from '../rabbitmq/rabbitmq.module';
import { RmqExchanges } from '../rabbitmq/exchanges';
import { KeysController } from './controllers';
import { UtilsModule } from '../utils';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Keys.name, schema: KeysSchema }]),
    PvzModule,
    UtilsModule,
    RmqModule.register({ exchanges: [RmqExchanges.STATISTICS] }),
    AverageModule,
  ],
  providers: [KeysRepository, KeysService, KeysPvzService],
  exports: [KeysService],
  controllers: [KeysController],
})
export class KeysModule { }
