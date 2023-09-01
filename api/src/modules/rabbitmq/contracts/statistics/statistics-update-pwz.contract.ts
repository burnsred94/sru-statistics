import { StatisticsEventsRMQ } from './events';

export namespace StatisticsUpdatePwzRMQ {
  export const routingKey = StatisticsEventsRMQ.UPDATE_STATISTIC_PWZ;

  export const queue = `queue-${StatisticsEventsRMQ.UPDATE_STATISTIC_PWZ}`;

  export class Payload {
    _id: string;
    addressId: string;
    city: string;
    address: string;
  }

  export class Response {}
}
