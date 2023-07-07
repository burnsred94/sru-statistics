import {
  MessageHandlerErrorBehavior,
  RabbitSubscribe,
} from '@golevelup/nestjs-rabbitmq';
import { applyDecorators } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { RabbitMqSubscribeParam } from '../interfaces';

export function RabbitMqSubscriber({
  exchange,
  routingKey,
  queue,
  currentService,
}: RabbitMqSubscribeParam) {
  return applyDecorators(
    RabbitSubscribe({
      exchange,
      routingKey,
      queue: `${currentService}_${queue}`,
      createQueueIfNotExists: true,
      errorHandler: error => {
        throw new RpcException(error);
      },
      queueOptions: {
        durable: true,
      },
      errorBehavior: MessageHandlerErrorBehavior.ACK,
    }),
  );
}
