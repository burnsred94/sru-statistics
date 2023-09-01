export interface IAverage {
  average: string;
  userId: number;
  difference: string;
}

export enum AverageStatus {
  WAIT_SENDING = 'WAIT_SENDING',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
}
