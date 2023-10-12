import { Injectable, Logger } from "@nestjs/common";
import { KeysRepository } from "../../repositories";
import { User } from "src/modules/auth";
import { Types } from "mongoose";
import { CoreKeysIntegrationService } from "src/modules/integrations/core-keys/services";
import { AverageService } from "src/modules/structures/average";
import { IAdaptiveProfile } from "src/modules/integrations/profiles/types";
import { forEach } from "lodash";
import { PvzService } from "src/modules/structures/pvz";

@Injectable()
export class KeyBuilder {
    protected readonly logger = new Logger(KeyBuilder.name);

    average: Types.ObjectId;
    address: Promise<Types.ObjectId>[];
    frequency: Promise<number>;
    sender_data: {
        average
    }

    constructor(
        private readonly keysRepository: KeysRepository,
        private readonly addressService: PvzService,
        private readonly averageService: AverageService,
        private readonly coreKeysIntegrationService: CoreKeysIntegrationService
    ) { }

    async createAverage(user: User) {
        const average = await this.averageService.create({ userId: user as unknown as number }) // Поправить на нужный тип
        this.average = average._id;
        return this
    }

    async createAddress(cities: IAdaptiveProfile[], article: string, user: User) {
        forEach(cities, (element) => {
            const address = this.addressService.create(cities, article, user)
                .then((result) => {
                    return result._id;
                })
            this.address.push(address)
        })
    }

    async getFrequency(key: string) {
        const frequency = this.coreKeysIntegrationService.getFrequency(key);
        this.frequency = frequency;
        return this
    }
}