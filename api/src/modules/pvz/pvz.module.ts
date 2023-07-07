import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Pvz, PvzSchema } from './schemas';
import { PvzService } from './services';
import { PvzRepository } from './repositories';
import { PeriodsModule } from '../periods';
import { PvzController } from './controllers';
import { PvzUtils } from './utils';
import { RmqModule } from '../rabbitmq/rabbitmq.module';
import { RmqExchanges } from '../rabbitmq/exchanges';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Pvz.name, schema: PvzSchema }]),
    PeriodsModule,
    RmqModule.register({ exchanges: [RmqExchanges.STATISTICS] })
  ],
  providers: [PvzService, PvzRepository, PvzUtils],
  controllers: [PvzController],
  exports: [PvzService],
})
export class PvzModule { }
