import { User } from 'src/modules/auth';
import { StatisticsEventsRMQ } from './events';

export namespace StatisticsGetArticlesRMQ {
    export const routingKey = StatisticsEventsRMQ.GET_ARTICLES_FROM_UPLOAD;

    export const queue = `queue-${StatisticsEventsRMQ.GET_ARTICLES_FROM_UPLOAD}`;

    export class Payload {
        userId: User;
        articles: string[];
        periods: string[];
    }

    export class Response { }
}