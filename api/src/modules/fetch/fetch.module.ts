import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GotModule } from '@t00nday/nestjs-got';
import { FetchProvider, TaskSenderQueue } from './provider';
import { RmqModule } from '../rabbitmq/rabbitmq.module';
import { RmqExchanges } from '../rabbitmq/exchanges';
import { RabbitRpcParamsFactory } from '@golevelup/nestjs-rabbitmq';
import { FetchController } from './controllers';
import { FetchUtils } from './utils';
import { KeysModule } from '../structures/keys';
import { PvzModule } from '../structures/pvz';

@Module({
  providers: [FetchProvider, FetchUtils, TaskSenderQueue],
  imports: [
    ConfigModule,
    GotModule,
    KeysModule,
    PvzModule,
    RabbitRpcParamsFactory,
    RmqModule.register({
      exchanges: [RmqExchanges.SEARCH, RmqExchanges.PROFILE, RmqExchanges.PRODUCT, RmqExchanges.CORE_KEYS],
    }),
  ],
  exports: [FetchProvider, TaskSenderQueue],
  controllers: [FetchController],
})
export class FetchModule { }
