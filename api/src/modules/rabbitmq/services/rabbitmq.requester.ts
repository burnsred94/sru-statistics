import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { RabbitMqPublishParam } from '../interfaces';

@Injectable()
export class RabbitMqRequester {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  async request<T, R>({
    exchange,
    routingKey,
    payload,
    timeout,
  }: RabbitMqPublishParam<T>): Promise<R> {
    const response = await this.amqpConnection.request<R>({
      exchange,
      routingKey,
      payload,
      timeout,
    });

    return response;
  }
}
