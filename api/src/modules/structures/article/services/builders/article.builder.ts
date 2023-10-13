import { Injectable, Logger } from "@nestjs/common";
import { forEach, map } from "lodash";
import { HydratedDocument, Types } from "mongoose";
import { User } from "src/modules/auth";
import { ProductsIntegrationService } from "src/modules/integrations/products/services";
import { IProductResponse } from "src/modules/integrations/products/types";
import { ProfilesIntegrationService } from "src/modules/integrations/profiles/services";
import { IAdaptiveProfile } from "src/modules/integrations/profiles/types";
import { KeyBuilder, KeysService } from "src/modules/structures/keys";
import { IKeySendData } from "src/modules/structures/keys/types";
import { Article } from "../../schemas";
import { ArticleRepository } from "../../repositories";
import { PaginationService } from "src/modules/structures/pagination";


export type TupleCreateArticle = [Types.ObjectId, IProductResponse];

@Injectable()
export class ArticleBuilder {
    protected readonly logger = new Logger(ArticleBuilder.name);

    private readonly _id: Types.ObjectId = new Types.ObjectId();

    document: Promise<HydratedDocument<Article>>;
    keywords: Types.ObjectId[];
    user: User;
    article: string;
    pagination: Promise<Types.ObjectId>;
    keys = [] as Types.ObjectId[];
    send_data = [] as IKeySendData[];
    cities: Promise<IAdaptiveProfile[]>;
    product: Promise<IProductResponse>;


    constructor(
        private readonly profileIntegration: ProfilesIntegrationService,
        private readonly paginationService: PaginationService,
        private readonly articleRepository: ArticleRepository,
        private readonly productIntegration: ProductsIntegrationService,
        private readonly keyBuilder: KeyBuilder
    ) { }

    create() {
        Promise.all([this.pagination, this.product])
            .then((data: TupleCreateArticle) => {
                const [pagination, product] = data;

                this.document = this.articleRepository.create({
                    _id: this._id,
                    article: this.article,
                    userId: this.user,
                    pagination: pagination,
                    productName: product.product_name,
                    productRef: product.product_url,
                    productImg: product.img,
                    keys: this.keys
                });
            });

        return this;
    }

    keywordCreate(keywords: string[], user: User) {
        this.user = user;

        Promise.resolve(this.cities)
            .then((data) => {
                forEach(keywords, (key) => {
                    const builder = this.keyBuilder
                        .getFrequency(key)
                        .createAverage(user)
                        .createAddress(data, this.article)
                        .create()

                    // builder.getDocument()
                    //     .then((doc) => {
                    //         this.keys.push(doc._id)
                    //     })
                    console.log(key)

                    // builder.getSendData()
                    //     .then((data) => {
                    //         this.send_data.push(data)
                    //     })

                })
            })


        return this
    }

    getProduct(article: string) {
        this.article = article
        this.product = this.productIntegration.getProduct(article);
        return this
    }

    getCities(user: User) {
        const cities = this.profileIntegration.getTownsProfile(user);
        this.cities = cities;
        return this
    }

    initPagination(id = this._id) {
        this.pagination = this.paginationService.create({ article_id: id })
            .then((document) => document._id);
        return this;
    }
}