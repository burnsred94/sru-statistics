import { Types } from 'mongoose';
import { SearchPositionRMQ } from 'src/modules/rabbitmq/contracts/search';

export interface IPvzRMQSendStructure {
  name: string;
  average_id?: Types.ObjectId;
  addressId: Types.ObjectId;
  geo_address_id: string;
  periodId: Types.ObjectId;
  current_position?: string;
}

export interface IPullIdsResponse {
  send_data: SearchPositionRMQ.Payload;
  average: Types.ObjectId;
}
