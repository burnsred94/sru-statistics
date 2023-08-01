import { ISubSettings, Town } from 'src/interfaces';
import { ProfileEventsRMQ } from './events';

export namespace GetProfileRMQ {
  export const routingKey = ProfileEventsRMQ.GET_PROFILE;

  export const queue = `queue-${ProfileEventsRMQ.GET_PROFILE}`;

  export class Payload {
    userId: number;
  }

  export class Response {
    _id: string;
    userId: number;
    subscription_settings: ISubSettings;
    towns: Town[];
    createdAt: string;
  }
}
