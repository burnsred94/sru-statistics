import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Keys, KeysSchema } from './schemas';
import { KeysRepository } from './repositories';
import { KeyBuilder, KeysService } from './services';
import { PvzModule } from '../pvz';
import { AverageModule } from '../average';
import { RmqModule } from '../../rabbitmq/rabbitmq.module';
import { RmqExchanges } from '../../rabbitmq/exchanges';
import { KeysController } from './controllers';
import { FetchModule } from '../../fetch';
import { QueueModule } from 'src/modules/lib/queue';
import { EventsModule } from 'src/modules/lib/events/event.module';
import { CoreKeysIntegrationModule } from 'src/modules/integrations';
import { InspectorKeywords } from './services/inspectors/inspector-keywords.inspector';
import { KeywordContextModule } from 'src/modules/core/update/keywords-context/keywords-context.module';
import { UpdateKeywordService } from './services/updates';

const STRUCTURES = [PvzModule, AverageModule];
const SERVICES = [KeysService, KeyBuilder, InspectorKeywords, UpdateKeywordService];

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Keys.name, schema: KeysSchema }]),
    forwardRef(() => FetchModule),
    KeywordContextModule,
    CoreKeysIntegrationModule,
    EventsModule,
    QueueModule,
    RmqModule.register({ exchanges: [RmqExchanges.STATISTICS] }),
    ...STRUCTURES,
  ],
  providers: [KeysRepository, ...SERVICES],
  exports: [...SERVICES],
  controllers: [KeysController],
})
export class KeysModule { }
