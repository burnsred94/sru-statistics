import { Injectable } from "@nestjs/common";
import { User } from "src/modules/auth";
import { GetProfileRMQ } from "src/modules/rabbitmq/contracts/profile";
import { RmqExchanges } from "src/modules/rabbitmq/exchanges";
import { RabbitMqRequester } from "src/modules/rabbitmq/services";
import { ProfileIntegrationAdapter } from "../adapters";
import { IAdaptiveProfile } from "../types";


@Injectable()
export class ProfilesIntegrationService {

    constructor(
        private readonly rmqRequester: RabbitMqRequester,
        private readonly profileIntegrationAdapter: ProfileIntegrationAdapter
    ) { }

    async getTownsProfile(id: User): Promise<IAdaptiveProfile[]> {
        const response = await this.rmqRequester.request<GetProfileRMQ.Payload, GetProfileRMQ.Response>({
            exchange: RmqExchanges.PROFILE,
            routingKey: GetProfileRMQ.routingKey,
            payload: { userId: id },
            timeout: 5000 * 10,
        });

        return await this.profileIntegrationAdapter.adaptiveResponseDataProfile(response);
    }
}