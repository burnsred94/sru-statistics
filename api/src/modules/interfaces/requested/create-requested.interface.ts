import { User } from 'src/modules/auth/user';

export interface ICreateStatistic {
  article: string;
  keys: string[];
  towns: ITown[];
}

export interface ITown {
  city: string;
  _id: string;
  pwz: IPwz[];
}

export interface IPwz {
  _id: string;
  name: string;
}

export interface ICreateRequest {
  city: string;
  _id: string;
  data: DataClass;
}

export interface DataClass {
  address: string;
  result: Result[];
}

export interface Result {
  key: string;
  position: string;
}

export interface IDestructionResult {
  userId: User;
  article: string;
  dataSearch: ReduceSearchResult[];
  productName: string;
}

export interface ReduceSearchResult {
  city: string;
  _id: string;
  data: Data[][];
}

export interface ReduceSearchResultTwo {
  city: string;
  _id: string;
  data: Data[];
}

export interface Data {
  key: string;
  result: Result | Result[];
}

export interface Result {
  _id: string;
  address: string;
  position: string;
}
