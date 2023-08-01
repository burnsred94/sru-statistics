import { StatisticsEventsRMQ } from './events';

export namespace StatisticsEnabledRMQ {
  export const routingKey = StatisticsEventsRMQ.ENABLED_STATISTICS_FROM_SUB;

  export const queue = `queue-${StatisticsEventsRMQ.ENABLED_STATISTICS_FROM_SUB}`;

  export class Payload {
    userId: number;
  }

  export class Response {}
}
