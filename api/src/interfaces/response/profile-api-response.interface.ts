export interface IProfileApiResponse {
  _id: string;
  userId: number;
  subscription_settings: ISubSettings;
  towns: Town[];
  createdAt: string;
}

export interface ISubSettings {
  end_subscription: null | Date;
  keys_count: number;
  pwz_count: number;
  start_subscription: null | Date;
  type_subscription: string;
}

export interface Town {
  _id: string;
  city_id: string;
  city: string;
  addresses: Address[];
}

export interface Address {
  _id: string;
  addressId: string;
  address: string;
}
