import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Keys, KeysSchema } from './schemas';
import { KeysRepository } from './repositories';
import { KeysService } from './services';
import { PvzModule } from '../pvz';
import { AverageModule } from '../average';
import { RmqModule } from '../../rabbitmq/rabbitmq.module';
import { RmqExchanges } from '../../rabbitmq/exchanges';
import { KeysController } from './controllers';
import { UtilsModule } from '../../utils';
import { FetchModule } from '../../fetch';
import { QueueModule } from 'src/modules/lib/queue';

const STRUCTURES = [
  PvzModule,
  AverageModule
]

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Keys.name, schema: KeysSchema }]),
    forwardRef(() => FetchModule),
    UtilsModule,
    QueueModule,
    RmqModule.register({ exchanges: [RmqExchanges.STATISTICS] }),
    ...STRUCTURES
  ],
  providers: [KeysRepository, KeysService],
  exports: [KeysService],
  controllers: [KeysController],
})
export class KeysModule { }
