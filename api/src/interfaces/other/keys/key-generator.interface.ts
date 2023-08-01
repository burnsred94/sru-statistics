export interface IKeyGenerator {
  _id: string;
  key: string;
  userId: number;
  article: string;
  average: IAverageGenerator[];
  pwz: IPwzGenerator[];
  __v: number;
}

export interface IAverageGenerator {
  _id: string;
  timestamp: string;
  average: string;
}

export interface IPwzGenerator {
  _id: string;
  name: string;
  city: string;
  geo_address_id: string;
  city_id: string;
  position: IPositionGenerator[];
}

export interface IPositionGenerator {
  _id: string;
  position: string;
  timestamp: string;
  difference: string;
}
