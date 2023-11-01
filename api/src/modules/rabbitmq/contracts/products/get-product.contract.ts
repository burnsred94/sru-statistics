import { IProductResponse } from 'src/modules/integrations/products/types';
import { ProductEventsRMQ } from './events/product.events';

export namespace GetProductRMQ {
  export const routingKey = ProductEventsRMQ.GET_PRODUCT;

  export const queue = `queue-${ProductEventsRMQ.GET_PRODUCT}`;

  export class Payload {
    article: string;
  }

  export class Response implements IProductResponse {
    img: string;
    product_name: string;
    product_url: string;
    status: boolean;
  }
}
