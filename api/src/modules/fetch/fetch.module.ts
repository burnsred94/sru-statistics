import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GotModule } from '@t00nday/nestjs-got';
import { FetchProvider } from './provider';
import { KeysModule } from '../keys';
import { FetchUtils } from './utils';
import { RmqModule } from '../rabbitmq/rabbitmq.module';
import { RmqExchanges } from '../rabbitmq/exchanges';
import { RabbitRpcParamsFactory } from '@golevelup/nestjs-rabbitmq';

@Module({
  providers: [FetchProvider, FetchUtils],
  imports: [
    ConfigModule,
    GotModule,
    KeysModule,
    RabbitRpcParamsFactory,
    RmqModule.register({
      exchanges: [RmqExchanges.SEARCH, RmqExchanges.PROFILE, RmqExchanges.PRODUCT],
    }),
  ],
  exports: [FetchProvider],
})
export class FetchModule { }
