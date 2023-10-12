import { Module } from "@nestjs/common";
import { CoreKeysIntegrationService } from "./services";
import { RmqModule } from "src/modules/rabbitmq/rabbitmq.module";
import { RmqExchanges } from "src/modules/rabbitmq/exchanges";
import { RabbitRpcParamsFactory } from "@golevelup/nestjs-rabbitmq";


@Module({
    providers: [CoreKeysIntegrationService, RabbitRpcParamsFactory],
    imports: [
        RmqModule.register({
            exchanges: [
                RmqExchanges.CORE_KEYS,
            ],
        }),
    ],
    exports: [CoreKeysIntegrationService],
})
export class CoreKeysIntegrationModule { }