import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Keys, KeysSchema } from './schemas';
import { KeysRepository } from './repositories';
import { KeysRefreshService, KeysService } from './services';
import { PvzModule } from '../pvz';
import { AverageModule } from '../average';
import { RmqModule } from '../../rabbitmq/rabbitmq.module';
import { RmqExchanges } from '../../rabbitmq/exchanges';
import { KeysController } from './controllers';
import { UtilsModule } from '../../utils';
import { FetchModule } from '../../fetch';
import { QueueModule } from 'src/modules/lib/queue';
import { KeysUtilsModule } from './utils/keys-utils.module';
import { EventsModule } from 'src/modules/lib/events/event.module';

const STRUCTURES = [PvzModule, AverageModule];

const SERVICES = [KeysRefreshService, KeysService];

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Keys.name, schema: KeysSchema }]),
    forwardRef(() => FetchModule),
    UtilsModule,
    EventsModule,
    KeysUtilsModule,
    QueueModule,
    RmqModule.register({ exchanges: [RmqExchanges.STATISTICS] }),
    ...STRUCTURES,
  ],
  providers: [KeysRepository, ...SERVICES],
  exports: [...SERVICES],
  controllers: [KeysController],
})
export class KeysModule { }
