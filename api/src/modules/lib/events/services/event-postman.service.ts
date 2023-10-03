import { Injectable, Optional } from "@nestjs/common";
import { IEventPostman, StrategyEventSender } from "../types/interfaces";


@Injectable()
export class EventSenderService {

    private strategy: StrategyEventSender

    constructor(@Optional() strategy: StrategyEventSender) {
        this.strategy = strategy;
    }

    public setStrategy(strategy: StrategyEventSender) {
        this.strategy = strategy;
    }

    public postman(data: IEventPostman, callback: () => Promise<boolean>) {
        this.strategy.eventSender(data, callback);
    }
}