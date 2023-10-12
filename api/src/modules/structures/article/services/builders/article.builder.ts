import { Injectable } from "@nestjs/common";
import { Types } from "mongoose";
import { User } from "src/modules/auth";
import { ProductsIntegrationService } from "src/modules/integrations/products/services";
import { IProductResponse } from "src/modules/integrations/products/types";
import { ProfilesIntegrationService } from "src/modules/integrations/profiles/services";
import { IAdaptiveProfile } from "src/modules/integrations/profiles/types";
import { KeysService } from "src/modules/structures/keys";

//TODO:
// Написать стратегию создания ключей

@Injectable()
export class ArticleBuilder {

    keywords: Types.ObjectId[];
    cities: IAdaptiveProfile[];
    product: Promise<IProductResponse>;


    constructor(
        private readonly profileIntegration: ProfilesIntegrationService,
        private readonly productIntegration: ProductsIntegrationService,
        private readonly keywordsService: KeysService
    ) { }

    async keywordCreate(keywords: string[]) {
        // const keywords = await this.keywordsService.create(keywords);
        return this
    }

    async getProduct(article: string) {
        const product = this.productIntegration.getProduct(article);
        this.product = product;
        return this
    }

    async getCities(user: User) {
        const cities = await this.profileIntegration.getTownsProfile(user);
        this.cities = cities;
        return this
    }
}