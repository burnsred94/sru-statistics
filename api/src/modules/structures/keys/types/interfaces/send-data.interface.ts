import { Types } from 'mongoose';

export interface IKeySendData {
  average_id: Types.ObjectId;
  pwz: IAddressSendData[];
  article: string;
  key: string;
  key_id: Types.ObjectId;
}

export interface IAddressSendData {
  name: string;
  average_id: Types.ObjectId;
  addressId: string;
  geo_address_id: string;
  periodId: Types.ObjectId;
}
