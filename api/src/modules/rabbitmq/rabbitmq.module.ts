import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  RabbitMQModule,
  RabbitRpcParamsFactory,
} from '@golevelup/nestjs-rabbitmq';
import { RabbitMqPublisher } from './services/rabbitmq.publisher';
import { RabbitMqRequester } from './services/rabbitmq.requester';
import { RabbitMqModuleConfig } from './interfaces';

@Module({})
export class RmqModule {
  static register(config: RabbitMqModuleConfig): DynamicModule {
    const { exchanges } = config;
    return {
      module: RabbitMQModule,
      imports: [
        RabbitMQModule.forRootAsync(RabbitMQModule, {
          useFactory: () => {
            return {
              exchanges: exchanges.map(exchange => {
                return {
                  name: exchange,
                  type: 'topic',
                  options: {},
                };
              }),
              uri: 'amqp://admin:changeme@64.226.124.194:5672',
              connectionInitOptions: { wait: false },
              enableControllerDiscovery: true,
              validateMessage: true,
              enableDirectReplyTo: true,
              defaultRpcTimeout: 5000,
              pipes: [],
              channels: {
                'channel-1': {
                  prefetchCount: 50,
                  default: true,
                },
              },
            };
          },
          inject: [ConfigService],
          imports: [ConfigModule],
        }),
      ],
      providers: [RabbitMqPublisher, RabbitMqRequester, RabbitRpcParamsFactory],
      exports: [RabbitMqPublisher, RabbitMqRequester],
    };
  }
}
