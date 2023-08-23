import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { applyDecorators } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { RabbitMqSubscribeParam } from '../interfaces';

export function RabbitMqResponser({
  exchange,
  routingKey,
  queue,
  currentService,
}: RabbitMqSubscribeParam) {
  return applyDecorators(
    RabbitRPC({
      exchange,
      routingKey,
      queue: `${currentService}_${queue}`,
      createQueueIfNotExists: true,
      errorHandler: error => {
        throw new RpcException(`Error RMQ: ${error}`);
      },
      queueOptions: {
        durable: true,
      },
    }),
  );
}
