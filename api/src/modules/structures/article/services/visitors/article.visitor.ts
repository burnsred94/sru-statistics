import { BadRequestException, Injectable, Logger, Scope } from "@nestjs/common";
import { ArticleRepository } from "../../repositories";
import { HydratedDocument } from "mongoose";
import { Article } from "../../schemas";
import { Active, ActiveSub } from "../../types/classes";
import { DEFAULT_ERROR_ARTICLE_FIND, DEFAULT_FLAGS_SWITCH } from "../../constants";
import { KeyBuilder, Keys } from "src/modules/structures/keys";
import { EventPostmanDispatcher } from "src/modules/lib/events/event-postman.dispatcher";
import { AbstractArticleService } from "../article-service.abstract";
import { ARTICLE_POPULATE } from "../../constants/populate";





@Injectable({ scope: Scope.REQUEST })
export class ArticleVisitor extends AbstractArticleService {
    protected readonly logger = new Logger(ArticleVisitor.name);

    document: Promise<HydratedDocument<Article>>

    constructor(
        readonly eventPostmanDispatcher: EventPostmanDispatcher,
        private readonly articleRepository: ArticleRepository,
        private readonly keyBuilder: KeyBuilder,
    ) {
        super(eventPostmanDispatcher)
    }

    setDocument(document: HydratedDocument<Article>) {
        this.document = new Promise((resolve) => resolve(document))
        return this
    }

    switchArticle(switchQuery: Active | ActiveSub) {
        try {
            return Promise.resolve(this.document)
                .then(async (document) => {
                    if (!document) throw new BadRequestException(DEFAULT_ERROR_ARTICLE_FIND);

                    this.articleRepository.findOneAndUpdate({ _id: document._id }, { $set: switchQuery });
                    const { keys } = await this.articleRepository.findOne({ _id: document._id }, ARTICLE_POPULATE);
                    const keywords = keys as unknown as HydratedDocument<Keys>[];

                    if (switchQuery instanceof Active && switchQuery.active === true) {
                        return await this.activeKeywords(keywords, switchQuery);
                    } else if (switchQuery instanceof Active && switchQuery.active === false) {
                        return await this.disabledKeywords(keywords, switchQuery);
                    } else if (switchQuery instanceof ActiveSub && switchQuery.active_sub === false) {
                        await this.disabledKeywords(keywords, switchQuery);
                    } else if (switchQuery instanceof ActiveSub && switchQuery.active_sub === true) {
                        return await this.activeKeywords(keywords, switchQuery);
                    } else {
                        throw new BadRequestException(DEFAULT_FLAGS_SWITCH)
                    }
                })
                .catch((error) => {
                    this.logger.error(error.message);
                    throw error;
                })
                .then((document) => {
                    if (document) {
                        super.activateSendPostman(document.keys.length, document.userId);
                    }
                    return document
                })

        } catch (error) {
            throw error
        }
    }

    async activeKeywords(keywords: HydratedDocument<Keys>[], switchQuery: Active | ActiveSub): Promise<HydratedDocument<Article>> {
        if (keywords.length === 0) return this.document;

        return Promise.resolve(this.document)
            .then((document) => {

                while (keywords.length > 0) {
                    const keyword = keywords.shift() as unknown as HydratedDocument<Keys>;
                    this.keyBuilder
                        .getFrequency(keyword.key)
                        .enabledKeyword(keyword, switchQuery);
                }
                return document;
            })
    }

    async disabledKeywords(keywords: HydratedDocument<Keys>[], switchQuery: Active | ActiveSub): Promise<HydratedDocument<Article>> {
        if (keywords.length === 0) return this.document;

        return Promise.resolve(this.document)
            .then((document) => {

                this.articleRepository.findOneAndUpdate({ _id: document._id }, { $inc: { count: - keywords.length } });

                while (keywords.length > 0) {
                    const keyword = keywords.shift() as unknown as HydratedDocument<Keys>;
                    this.keyBuilder
                        .disabledKeywords(keyword, switchQuery);
                }
                return document
            })
    }
}