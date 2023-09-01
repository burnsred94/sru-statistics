import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Pvz, PvzSchema } from './schemas';
import { PvzService } from './services';
import { PvzRepository } from './repositories';
import { PeriodsModule } from '../periods';
import { PvzController } from './controllers';
import { RmqModule } from '../../rabbitmq/rabbitmq.module';
import { RmqExchanges } from '../../rabbitmq/exchanges';
import { KeysModule } from '../keys';
import { TaskUpdateQueue } from './utils';
import { PvzQueue } from './services/pvz-queue.service';
import { UtilsModule } from '../../utils';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Pvz.name, schema: PvzSchema }]),
    PeriodsModule,
    UtilsModule,
    RmqModule.register({ exchanges: [RmqExchanges.STATISTICS] }),
    forwardRef(() => KeysModule),
  ],
  providers: [PvzService, PvzRepository, TaskUpdateQueue, PvzQueue],
  controllers: [PvzController],
  exports: [PvzService],
})
export class PvzModule {}
