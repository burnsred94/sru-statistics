import { StatisticsEventsRMQ } from './events';

export namespace StatisticsDisabledRMQ {
  export const routingKey = StatisticsEventsRMQ.DISABLED_STATISTICS_FROM_SUB;

  export const queue = `queue-${StatisticsEventsRMQ.DISABLED_STATISTICS_FROM_SUB}`;

  export class Payload {
    users: Array<number>;
  }

  export class Response {}
}
