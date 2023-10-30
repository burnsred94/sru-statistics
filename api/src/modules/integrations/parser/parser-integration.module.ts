import { Module } from '@nestjs/common';
import { ParserIntegrationService } from './services/parser-integration.service';
import { RmqModule } from 'src/modules/rabbitmq/rabbitmq.module';
import { RmqExchanges } from 'src/modules/rabbitmq/exchanges';
import { ParserIntegrationAdapter } from './adapters/parser-integration.adapter';
import { RabbitRpcParamsFactory } from '@golevelup/nestjs-rabbitmq';

@Module({
  imports: [
    RmqModule.register({
      exchanges: [RmqExchanges.SEARCH],
    }),
  ],
  providers: [ParserIntegrationService, ParserIntegrationAdapter, RabbitRpcParamsFactory],
  exports: [ParserIntegrationService],
})
export class ParserIntegrationModule {}
