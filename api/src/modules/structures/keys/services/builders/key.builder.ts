import { Injectable, Logger } from "@nestjs/common";
import { KeysRepository } from "../../repositories";
import { User } from "src/modules/auth";
import { HydratedDocument, Types } from "mongoose";
import { CoreKeysIntegrationService } from "src/modules/integrations/core-keys/services";
import { Average, AverageService } from "src/modules/structures/average";
import { IAdaptiveProfile } from "src/modules/integrations/profiles/types";
import { map } from "lodash";
import { Keys } from "../../schemas";
import { IPreparationKey } from "src/modules/structures/article/services/builders/article.builder";
import { PvzService } from "src/modules/structures/pvz";
import { KeywordsContextService } from "src/modules/core/update/keywords-context/keywords-context.service";
import { STRATEGY_REFRESH } from "src/modules/core/update/keywords-context/types";
import { KeysRefreshPopulate } from "../../constants";
import { Active, ActiveSub } from "src/modules/structures/article/types/classes";




@Injectable()
export class KeyBuilder {
    protected readonly logger = new Logger(KeyBuilder.name);

    document: Promise<HydratedDocument<Keys>>;

    private average: Promise<HydratedDocument<Average>>;
    private address: Promise<Types.ObjectId[]>;
    private frequency: Promise<number>;

    constructor(
        private readonly keysRepository: KeysRepository,
        private readonly keywordsRefreshContext: KeywordsContextService,
        private readonly addressService: PvzService,
        private readonly averageService: AverageService,
        private readonly coreKeysIntegrationService: CoreKeysIntegrationService
    ) {
    }

    create(key: string, user: User, article: string, address: Promise<IPreparationKey>) {
        const document = Promise.resolve(address)
            .then(async (data) => {
                const resolve = await Promise.all([data.address, data.average, data.frequency, data.pwz]);
                const [address, average, frequency] = resolve;

                const document = await this.keysRepository.create(
                    { average, key, frequency, userId: user, pwz: address, article },
                    KeysRefreshPopulate
                );
                this.keywordsRefreshContext.setProcessor(STRATEGY_REFRESH.KEYWORDS_DATA_REFRESH);
                this.keywordsRefreshContext.refresh(document);

                return document
            })

        this.document = document
        return this
    }

    createAverage(user: User) {
        this.average = this.averageService.create({ userId: user as unknown as number });
        return this
    }

    createAddress(cities: IAdaptiveProfile[], article: string, user: User): Promise<IPreparationKey> {

        this.address = Promise.all(
            map(cities, async (element) => {
                try {
                    const document = await this.addressService.create(element, article, user);
                    return document._id;
                } catch (error) {
                    this.logger.error(error.message);
                    throw error;
                }
            })
        )

        const result: Promise<IPreparationKey> = Promise.resolve(
            Object.create({ address: this.address, average: this.average, frequency: this.frequency })
        )

        return result
    }

    getFrequency(key: string) {
        this.frequency = this.coreKeysIntegrationService.getFrequency(key)
            .catch((error) => {
                this.logger.error({
                    target: `Error method: ${this.getFrequency.name}`,
                    error: `Error: ${error.message}`
                });

                return 0
            });

        return this
    }

    enabledKeyword(keyword: HydratedDocument<Keys>, switchQuery: ActiveSub | Active) {
        Promise.resolve(this.frequency)
            .then(async (frequency) => {
                const { pwz } = keyword;

                const average = await this.averageService.checkAndUpdate(keyword.average.at(-1));

                if (average) {
                    this.keysRepository.findOneAndUpdate({ _id: keyword._id }, { $set: { frequency: frequency, ...switchQuery }, $push: { average: average } });
                } else {
                    this.keysRepository.findOneAndUpdate({ _id: keyword._id }, { $set: { frequency: frequency, ...switchQuery } });
                }

                new Promise(async (resolve) => {
                    const updatedAddress = [];
                    while (pwz.length > 0) {
                        const address = pwz.shift();
                        const result = await this.addressService.checkAndUpdate(address);
                        updatedAddress.push(result);
                    }
                    resolve([keyword, updatedAddress]);
                }).then(async ([keyword]) => {
                    const item = await this.keysRepository.findOne({ _id: keyword._id }, KeysRefreshPopulate);

                    this.keywordsRefreshContext.setProcessor(STRATEGY_REFRESH.KEYWORDS_DATA_REFRESH);
                    this.keywordsRefreshContext.refresh(item);
                })
            })
        return this;
    }

    disabledKeywords(keyword: HydratedDocument<Keys>, switchQuery: ActiveSub | Active) {
        this.keysRepository.findOneAndUpdate({ _id: keyword._id }, { $set: switchQuery })
        return this;
    }

    initialUpdateData(keyword: HydratedDocument<Keys>) {
        Promise.resolve(this.frequency)
            .then(async (frequency) => {
                const { pwz } = keyword;
                const average = await this.averageService.checkAndUpdate(keyword.average.at(-1));
                this.keysRepository.findOneAndUpdate({ _id: keyword._id }, { $set: { frequency }, $push: { average } });

                new Promise(async (resolve) => {
                    const updatedAddress = [];
                    while (pwz.length > 0) {
                        const address = pwz.shift();
                        const result = await this.addressService.checkAndUpdate(address);
                        updatedAddress.push(result);
                    }
                    resolve([keyword, updatedAddress]);
                }).then(async ([keyword]) => {
                    const item = await this.keysRepository.findOne({ _id: keyword._id }, KeysRefreshPopulate);

                    this.keywordsRefreshContext.setProcessor(STRATEGY_REFRESH.KEYWORDS_DATA_REFRESH);
                    this.keywordsRefreshContext.refresh(item);
                })
            })
        return this;
    }

    async getDocument(_id?: Types.ObjectId) {
        return _id ? this.keysRepository.findOne({ _id }, KeysRefreshPopulate) : this.document.then((document) => document._id);
    }

}