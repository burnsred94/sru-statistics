import { Injectable, Logger } from "@nestjs/common";
import { User } from "src/modules/auth";
import { ArticleRepository } from "../../repositories";
import { FetchProvider } from "src/modules/fetch";
import { SenderIoEvent, TownsDestructor } from "../../utils";
import { KeysService } from "src/modules";
import { MessagesEvent } from "src/interfaces";
import { GetProductRMQ } from "src/modules/rabbitmq/contracts/products";
import { DEFAULT_PRODUCT_NAME } from "../../constants";
import { Types } from "mongoose";
import { EventsParser, EventsWS } from "../../events";
import { EventEmitter2 } from "@nestjs/event-emitter";

/// Сделать когда возрващаються ключи проверить на актуальность позиции

@Injectable()
export class CreateArticleGenerator {
    protected readonly logger = new Logger(CreateArticleGenerator.name);

    constructor(
        private readonly articleRepository: ArticleRepository,
        private readonly fetchProvider: FetchProvider,
        private readonly eventEmitter: EventEmitter2,
        private readonly utilsDestructor: TownsDestructor,
        private readonly keyService: KeysService,
        private readonly senderIoEvent: SenderIoEvent
    ) { }


    async * findNotActiveAddKeys(article: string, keys, user) {
        const find_product = await this.articleRepository.findProductKeys(article, user, false);

        yield find_product;

        if (find_product.keys.length > 0) {
            const matchToNotActive = await this.utilsDestructor.matchKeysNotActive(keys, find_product.keys);
            matchToNotActive.length > 0 ? setImmediate(() => this.keyService.activateKey(matchToNotActive)) : null;

            await this.articleRepository.backOldArticle(find_product._id, user);
            yield `Product activate article: ${article}, id: ${find_product._id}`;
        }

        const active_product = await this.articleRepository.findProductKeys(article, user, true);
        const matchToActiveKeys = await this.utilsDestructor.matchKeys(keys, active_product.keys);

        if (matchToActiveKeys.length > 0) {
            const towns = await this.fetchProvider.fetchProfileTowns(user);
            const destructTowns = await this.utilsDestructor.destruct(towns);

            setImmediate(async () => {
                const newKeys = await this.keyService.create({
                    pvz: destructTowns,
                    keys: matchToActiveKeys,
                    userId: user,
                    article: article,
                });

                this.eventEmitter.emit(EventsParser.SEND_TO_PARSE, { userId: user });

                await this.articleRepository.update(newKeys as Types.ObjectId[], active_product._id);

                this.senderIoEvent.sender({ userId: user, article: article, key_count: newKeys.length });
            })
        }

        return { event: MessagesEvent.ENABLED_ARTICLE }
    }

    async * checkArticleAddKeys(article: string, keys, user: User) {
        const find_keys_active = await this.articleRepository.findProductKeys(article, user, true);
        let countAll = 0;
        let countActivate = 0;

        yield find_keys_active

        const matchToActiveKeys = await this.utilsDestructor.matchKeys(keys, find_keys_active.keys);
        countAll += matchToActiveKeys.length;

        const find_keys_not_active = await this.articleRepository.findProductKeys(article, user, true, false);

        if (find_keys_not_active.keys.length > 0) {
            const matchToNotActive = await this.utilsDestructor.matchKeysNotActive(keys, find_keys_not_active.keys);
            countActivate += matchToNotActive.length;

            matchToNotActive.length > 0 ? setImmediate(() => this.keyService.activateKey(matchToNotActive)) : null;
        }

        const towns = await this.fetchProvider.fetchProfileTowns(user);
        const destructTowns = await this.utilsDestructor.destruct(towns);

        setImmediate(async () => {
            const newKeys = await this.keyService.create({
                pvz: destructTowns,
                keys: matchToActiveKeys,
                userId: user,
                article: article,
            });

            this.eventEmitter.emit(EventsParser.SEND_TO_PARSE, { userId: user });

            await this.articleRepository.update(newKeys as Types.ObjectId[], find_keys_active._id);

            this.senderIoEvent.sender({ userId: user, article: article, key_count: newKeys.length });

        });

        return { count_all: countAll, count_activate: countActivate, event: MessagesEvent.ADD_KEYS };
    }

    async createGeneration(article: string, keys, user: User, product: GetProductRMQ.Response) {
        const towns = await this.fetchProvider.fetchProfileTowns(user);
        const destructTowns = await this.utilsDestructor.destruct(towns);

        setImmediate(async () => {
            const newKeys = await this.keyService.create({
                pvz: destructTowns,
                keys: keys,
                userId: user,
                article: article,
            });

            await this.articleRepository.create({
                productImg: product.status ? product.img : null,
                productRef: product.status ? product.product_url : null,
                userId: user,
                article: article,
                active: true,
                productName: product.status ? product.product_name : DEFAULT_PRODUCT_NAME,
                keys: newKeys as Types.ObjectId[],
            });

            this.eventEmitter.emit(EventsParser.SEND_TO_PARSE, { userId: user });
            this.eventEmitter.emit(EventsWS.SEND_ARTICLES, { userId: user })

            await this.fetchProvider.startTrialPeriod(user);

            this.senderIoEvent.sender({ userId: user, article: article, key_count: newKeys.length });
        });
    }

}