import { IEventPostman } from '.';

export interface StrategyEventSender {
  eventSender(data: IEventPostman, callback: () => Promise<boolean>): void;
}
