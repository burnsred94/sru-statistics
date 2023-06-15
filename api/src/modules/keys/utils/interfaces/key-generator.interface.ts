export interface IKey {
  _id: string;
  key: string;
  userId: number;
  city_id: string;
  average: IAverage[];
  pwz: IPwz[];
  __v: number;
}

export interface IAverage {
  _id: string;
  timestamp: string;
  average: string;
}

export interface IPwz {
  _id: string;
  name: string;
  position: IPosition[];
}

export interface IPosition {
  _id: string;
  position: string;
  timestamp: string;
  difference: string;
}
