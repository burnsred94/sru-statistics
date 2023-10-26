import { StrategyEventSender, IEventPostman } from '../../types/interfaces';

export class OnePostStrategy implements StrategyEventSender {
  second = 1000;

  public eventSender(data: IEventPostman, callback: () => Promise<boolean>): void {
    setImmediate(() => this.postman(data, callback));
  }

  private postman(data: IEventPostman, callback: () => Promise<boolean>, count = 0): void {
    let counter = count ?? 0;
    const timer = counter === 0 ? this.second : this.second * counter * 5;

    const id = setTimeout(() => {
      counter++;

      if (counter > 5) {
        clearTimeout(id);
        return;
      } else {
        callback().then(result => {
          result ? setImmediate(() => this.postman(data, callback, counter)) : clearTimeout(id);
        });
      }
    }, timer);
  }
}
