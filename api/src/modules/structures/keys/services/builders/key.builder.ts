import { Injectable, Logger } from "@nestjs/common";
import { KeysRepository } from "../../repositories";
import { User } from "src/modules/auth";
import { HydratedDocument, Types } from "mongoose";
import { CoreKeysIntegrationService } from "src/modules/integrations/core-keys/services";
import { AverageService } from "src/modules/structures/average";
import { IAdaptiveProfile } from "src/modules/integrations/profiles/types";
import { forEach, result } from "lodash";
import { PvzDocument, PvzService } from "src/modules/structures/pvz";
import { IKeySendData } from "../../types/interfaces";
import { KeysDocument } from "../../schemas";



@Injectable()
export class KeyBuilder {
    protected readonly logger = new Logger(KeyBuilder.name);

    document: Promise<Types.ObjectId>;

    send_data = {
        pwz: []
    } as IKeySendData;
    private keyword: string;
    private user: User;
    private article: string;
    private average: Types.ObjectId;
    private address = [] as Promise<Types.ObjectId>[];
    private frequency: Promise<number>;

    constructor(
        private readonly keysRepository: KeysRepository,
        private readonly addressService: PvzService,
        private readonly averageService: AverageService,
        private readonly coreKeysIntegrationService: CoreKeysIntegrationService
    ) { }

    create() {
        Promise.all([Promise.all(this.address), this.frequency])
            .then((data) => {
                const [addresses, frequency] = data;
                const key = this.keysRepository.create(
                    { average: [this.average], key: this.keyword, frequency, user: this.user, pwz: addresses, article: this.article }
                );
                console.log(key);
                // this.document = key.then((doc) => doc._id);
            })


        return this
    }

    createAverage(user: User) {
        this.user = user;

        this.averageService.create({ userId: user as unknown as number })
            .then((result) => {
                this.average = result._id;
                this.send_data.average_id = result._id;
            })
        return this
    }

    createAddress(cities: IAdaptiveProfile[], article: string) {
        this.send_data.article = article;

        forEach(cities, (element) => {
            const address = this.addressService.create(cities, article, this.user)
                .then((result) => {
                    this.send_data.pwz.push({
                        name: element.address,
                        average_id: this.average,
                        addressId: element.addressId,
                        geo_address_id: element.city_id,
                        periodId: result.position.at(-1)._id,
                    })
                    return result._id;
                });

            this.address.push(address);
        });

        return this
    }

    getFrequency(key: string) {
        this.send_data.key = key;
        this.keyword = key;
        const frequency = this.coreKeysIntegrationService.getFrequency(key);
        this.frequency = frequency;
        return this
    }

    getDocument() {
        return this.document;
    }

    getSendData(): IKeySendData {
        return this.send_data;
    }

    async confirm() {
        this.address = [];
        this.send_data = null;
    }

}