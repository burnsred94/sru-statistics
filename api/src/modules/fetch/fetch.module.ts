import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FetchProvider } from './provider';
import { RmqModule } from '../rabbitmq/rabbitmq.module';
import { RmqExchanges } from '../rabbitmq/exchanges';
import { RabbitRpcParamsFactory } from '@golevelup/nestjs-rabbitmq';
import { FetchController } from './controllers';
import { FetchUtils } from './utils';

@Module({
  providers: [FetchProvider, FetchUtils],
  imports: [
    ConfigModule,
    RabbitRpcParamsFactory,
    RmqModule.register({
      exchanges: [
        RmqExchanges.SEARCH,
        RmqExchanges.PROFILE,
        RmqExchanges.PRODUCT,
        RmqExchanges.CORE_KEYS,
      ],
    }),
  ],
  exports: [FetchProvider],
  controllers: [FetchController],
})
export class FetchModule { }
