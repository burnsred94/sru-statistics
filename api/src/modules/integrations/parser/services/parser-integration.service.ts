import { Injectable, Logger } from '@nestjs/common';
import { SearchPositionRMQ } from 'src/modules/rabbitmq/contracts/search';
import { RmqExchanges } from 'src/modules/rabbitmq/exchanges';
import { RabbitMqPublisher } from 'src/modules/rabbitmq/services';
import { ParserIntegrationAdapter } from '../adapters/parser-integration.adapter';
import { HydratedDocument } from 'mongoose';
import { Keys } from 'src/modules/structures/keys';

@Injectable()
export class ParserIntegrationService {
  protected readonly logger = new Logger(ParserIntegrationService.name);

  constructor(
    private readonly rmqPublisher: RabbitMqPublisher,
    private readonly parserIntegrationAdapter: ParserIntegrationAdapter,
  ) {}

  async sendToQueue(keyword: HydratedDocument<Keys>) {
    this.parserIntegrationAdapter.preparationData(keyword).then(data => {
      this.rmqPublisher.publish<SearchPositionRMQ.Payload>({
        exchange: RmqExchanges.SEARCH,
        routingKey: SearchPositionRMQ.routingKey,
        payload: data,
      });
    });
  }
}
