import { Injectable, Logger } from '@nestjs/common';
import { GetProductRMQ } from 'src/modules/rabbitmq/contracts/products';
import { RmqExchanges } from 'src/modules/rabbitmq/exchanges';
import { RabbitMqRequester } from 'src/modules/rabbitmq/services';
import { IProductResponse } from '../types';

@Injectable()
export class ProductsIntegrationService {
  protected readonly logger = new Logger(ProductsIntegrationService.name);

  constructor(private readonly rmqRequester: RabbitMqRequester) {}

  async getProduct(article: string): Promise<IProductResponse> {
    try {
      return await this.rmqRequester.request<GetProductRMQ.Payload, GetProductRMQ.Response>({
        exchange: RmqExchanges.PRODUCT,
        routingKey: GetProductRMQ.routingKey,
        timeout: 5000 * 10,
        payload: { article: article },
      });
    } catch (error) {
      this.logger.error(error.message);
    } finally {
      this.logger.log(
        `Sending message to exchange: ${RmqExchanges.PRODUCT} and routing: ${GetProductRMQ.routingKey}`,
      );
    }
  }
}
