import { CoreKeysEvents } from './events';

export namespace GetFrequencyRMQ {
  export const routingKey = CoreKeysEvents.GET_FREQUENCY;

  export const queue = `queue-${CoreKeysEvents.GET_FREQUENCY}`;

  export class Payload {
    key: string;
  }

  export class Response {
    frequency: number;
  }
}
