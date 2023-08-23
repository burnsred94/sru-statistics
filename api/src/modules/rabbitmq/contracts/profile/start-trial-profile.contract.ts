import { ProfileEventsRMQ } from './events';

export namespace StartTrialProfileRMQ {
  export const routingKey = ProfileEventsRMQ.START_TRIAL;

  export const queue = `queue-${ProfileEventsRMQ.START_TRIAL}`;

  export class Payload {
    userId: number;
  }

  export class Response {}
}
