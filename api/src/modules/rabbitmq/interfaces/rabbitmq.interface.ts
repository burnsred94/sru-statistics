export interface RabbitMqConsumerConfig {
  exchange: string;
  queue: string;
}

export interface RabbitMqModuleConfig {
  exchanges: string[];
}

interface RabbitMqMessage {
  exchange: string;
  routingKey: string;
}

export interface RabbitMqPublishParam<T> extends RabbitMqMessage {
  payload: T;
  timeout?: number;
}
export interface RabbitMqSubscribeParam extends RabbitMqMessage {
  queue: string;
  currentService: string;
}
