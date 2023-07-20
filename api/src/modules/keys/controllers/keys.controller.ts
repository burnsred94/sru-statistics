import { Controller, Logger } from "@nestjs/common";
import { KeysService } from "../services";
import { RabbitMqSubscriber } from "src/modules/rabbitmq/decorators";
import { RmqExchanges, RmqServices } from "src/modules/rabbitmq/exchanges";
import { StatisticsDisabledRMQ, StatisticsEnabledRMQ, StatisticsUpdatePwzRMQ } from "src/modules/rabbitmq/contracts/statistics";


@Controller()
export class KeysController {
    protected readonly logger = new Logger(KeysController.name);

    constructor(private readonly keysService: KeysService) { }


    @RabbitMqSubscriber({
        exchange: RmqExchanges.STATISTICS,
        routingKey: StatisticsDisabledRMQ.routingKey,
        queue: StatisticsDisabledRMQ.queue,
        currentService: RmqServices.STATISTICS,
    })
    async disableSubscription(payload: StatisticsDisabledRMQ.Payload) {
        this.logger.log(payload.users);
    }


    @RabbitMqSubscriber({
        exchange: RmqExchanges.STATISTICS,
        routingKey: StatisticsEnabledRMQ.routingKey,
        queue: StatisticsEnabledRMQ.queue,
        currentService: RmqServices.STATISTICS,
    })
    async enabledSubscription(payload: StatisticsEnabledRMQ.Payload) {
        this.logger.log(payload.userId);
    }


    @RabbitMqSubscriber({
        exchange: RmqExchanges.STATISTICS,
        routingKey: StatisticsUpdatePwzRMQ.routingKey,
        queue: StatisticsUpdatePwzRMQ.queue,
        currentService: RmqServices.STATISTICS,
    })
    async statisticUpdatePwz(payload) {
        this.logger.log(payload.userId);
    }
}