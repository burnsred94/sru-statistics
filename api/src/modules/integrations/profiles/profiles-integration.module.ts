import { Module } from "@nestjs/common";
import { ProfileIntegrationAdapter } from "./adapters";
import { ProfilesIntegrationService } from "./services";
import { RabbitRpcParamsFactory } from "@golevelup/nestjs-rabbitmq";
import { RmqModule } from "src/modules/rabbitmq/rabbitmq.module";
import { RmqExchanges } from "src/modules/rabbitmq/exchanges";


const PROFILE_INTEGRATION = [
    ProfileIntegrationAdapter,
    ProfilesIntegrationService
]

@Module({
    providers: [...PROFILE_INTEGRATION, RabbitRpcParamsFactory],
    imports: [
        RmqModule.register({
            exchanges: [
                RmqExchanges.PROFILE,
            ],
        }),
    ],
    exports: [ProfilesIntegrationService]
})
export class ProfilesIntegrationModule { }