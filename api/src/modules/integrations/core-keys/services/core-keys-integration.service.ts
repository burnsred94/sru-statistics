import { Injectable, Logger } from '@nestjs/common';
import { GetFrequencyRMQ } from 'src/modules/rabbitmq/contracts/core-keys';
import { RmqExchanges } from 'src/modules/rabbitmq/exchanges';
import { RabbitMqRequester } from 'src/modules/rabbitmq/services';

@Injectable()
export class CoreKeysIntegrationService {
  protected readonly logger = new Logger(CoreKeysIntegrationService.name);

  constructor(private readonly rmqRequester: RabbitMqRequester) { }

  async getFrequency(key: string): Promise<number> {
    try {
      const result = await this.rmqRequester.request<
        GetFrequencyRMQ.Payload,
        GetFrequencyRMQ.Response
      >({
        exchange: RmqExchanges.CORE_KEYS,
        routingKey: GetFrequencyRMQ.routingKey,
        timeout: 5000 * 50_000,
        payload: { key: key },
      });

      return result.frequency;
    } catch (error) {
      this.logger.error(error.message);
    } finally {
      // this.logger.log(`Sending message to exchange: ${RmqExchanges.CORE_KEYS} and routing: ${GetFrequencyRMQ.routingKey}`)
    }
  }
}
