import { Injectable } from '@nestjs/common';
import {
    Data,
    ReduceSearchResult,
    ReduceSearchResultTwo,
    Result,
} from 'src/modules/interfaces/requested/create-requested.interface';
import { KeyProvider } from './key.provider';
import { ArticleRepository, KeysRepository } from '../repositories';
import { map } from 'lodash';
import { Article } from '../schemas/index.';
import { Types } from 'mongoose';

@Injectable()
export class ArticleProvider {
    constructor(
        private readonly articleRepository: ArticleRepository,
        private readonly keyProvider: KeyProvider,
    ) { }

    async create(
        object: ReduceSearchResultTwo,
        article: string,
        email: string,
        telegramId: string,
    ) {
        const keys = await this.keyProvider.createKey(
            object.data,
            article,
            telegramId,
            email,
        )
        const data = await this.articleRepository.create({
            article: article,
            telegramId: telegramId,
            email: email,
            city: object.city,
            city_id: object._id,
            keys: [...keys] as unknown as [Types.ObjectId],
            productName: 'product',
        });

        return data;
    }
}
