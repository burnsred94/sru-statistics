import { Types } from 'mongoose';
import { SearchEventsRMQ } from './events/search.events';

export namespace SearchPositionRMQ {
  export const routingKey = SearchEventsRMQ.SEARCH_POSITION;

  export const queue = `queue-${SearchEventsRMQ.SEARCH_POSITION}`;

  export class Payload {
    article: string;
    key: string;
    key_id: Types.ObjectId;
    pvz: {
      name: string;
      average_id?: Types.ObjectId;
      addressId: Types.ObjectId;
      geo_address_id: string;
      periodId: Types.ObjectId;
      current_position?: string;
    }[];
  }

  export class Response {}
}
