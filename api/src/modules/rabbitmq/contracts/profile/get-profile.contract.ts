import { ISubSettings, Town } from 'src/interfaces';
import { ProfileEventsRMQ } from './events';
import { User } from 'src/modules/auth';
import { IProfileApiResponse } from 'src/modules/integrations/profiles/types';

export namespace GetProfileRMQ {
  export const routingKey = ProfileEventsRMQ.GET_PROFILE;

  export const queue = `queue-${ProfileEventsRMQ.GET_PROFILE}`;

  export class Payload {
    userId: User;
  }

  export class Response implements IProfileApiResponse {
    _id: string;
    userId: number;
    subscription_settings: ISubSettings;
    towns: Town[];
    createdAt: string;
  }
}
