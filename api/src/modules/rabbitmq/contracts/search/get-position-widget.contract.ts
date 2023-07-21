import { SearchEventsRMQ } from './events/search.events';

export namespace GetPositionWidgetsRMQ {
  export const routingKey = SearchEventsRMQ.GET_POSITION_WIDGET;

  export const queue = `queue-${SearchEventsRMQ.GET_POSITION_WIDGET}`;

  export class Payload {
    article: string;
    key: string;
  }

  export class Response {}
}
