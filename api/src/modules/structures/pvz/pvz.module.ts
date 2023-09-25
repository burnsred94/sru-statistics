import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Pvz, PvzSchema } from './schemas';
import { PvzService } from './services';
import { PvzRepository } from './repositories';
import { PeriodsModule } from '../periods';
import { RmqModule } from '../../rabbitmq/rabbitmq.module';
import { RmqExchanges } from '../../rabbitmq/exchanges';
import { UtilsModule } from '../../utils';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Pvz.name, schema: PvzSchema }]),
    PeriodsModule,
    UtilsModule,
    RmqModule.register({ exchanges: [RmqExchanges.STATISTICS] }),
  ],
  providers: [PvzService, PvzRepository],
  exports: [PvzService],
})
export class PvzModule { }
