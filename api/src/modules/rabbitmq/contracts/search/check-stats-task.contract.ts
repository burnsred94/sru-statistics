import { SearchEventsRMQ } from './events/search.events';

export namespace CheckStatusTaskRMQ {
  export const routingKey = SearchEventsRMQ.CHECK_STATUS_TASKS;

  export const queue = `queue-${SearchEventsRMQ.CHECK_STATUS_TASKS}`;

  export class Payload {}

  export class Response {}
}
