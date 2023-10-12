import { Module } from "@nestjs/common";
import { ProductsIntegrationService } from "./services";
import { RmqModule } from "src/modules/rabbitmq/rabbitmq.module";
import { RmqExchanges } from "src/modules/rabbitmq/exchanges";
import { RabbitRpcParamsFactory } from "@golevelup/nestjs-rabbitmq";


@Module({
    providers: [ProductsIntegrationService, RabbitRpcParamsFactory],
    imports: [
        RmqModule.register({
            exchanges: [
                RmqExchanges.PRODUCT,
            ],
        }),
    ],
    exports: [ProductsIntegrationService]
})
export class ProductsIntegrationModule { }