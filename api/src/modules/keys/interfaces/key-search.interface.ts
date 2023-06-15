export interface IKeyResult {
  status: number;
  data: IDataKeyResult[];
  errors: any[];
}

export interface IDataKeyResult {
  address: string;
  position: number;
}
