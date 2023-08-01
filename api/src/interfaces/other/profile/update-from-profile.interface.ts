export interface IUpdateFromProfile {
  status: number;
  data: IDataProfile;
  errors: any[];
}

export interface IDataProfile {
  userId: number;
  towns: ITownProfile[];
  createdAt: string;
  _id: string;
}

export interface ITownProfile {
  _id: string;
  city_id: string;
  city: string;
  addresses: IAddressProfile[];
}

export interface IAddressProfile {
  _id: string;
  addressId: string;
  address: string;
}
