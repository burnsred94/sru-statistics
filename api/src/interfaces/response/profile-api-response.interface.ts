export interface IProfileApiResponse {
  _id: string;
  userId: number;
  towns: Town[];
  createdAt: string;
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
