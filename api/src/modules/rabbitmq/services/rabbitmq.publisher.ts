import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { RabbitMqPublishParam } from '../interfaces/rabbitmq.interface';

@Injectable()
export class RabbitMqPublisher {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  async publish<T>({
    exchange,
    routingKey,
    payload,
  }: RabbitMqPublishParam<T>): Promise<void> {
    console.log('publishing message', { exchange, routingKey, payload });
    await this.amqpConnection.publish(exchange, routingKey, payload);
  }
}
