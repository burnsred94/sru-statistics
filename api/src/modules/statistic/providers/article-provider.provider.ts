import { Injectable } from '@nestjs/common';
import { ReduceSearchResultTwo } from 'src/modules/interfaces/requested/create-requested.interface';
import { KeyProvider } from './key.provider';
import { ArticleRepository } from '../repositories';
import { Types } from 'mongoose';

@Injectable()
export class ArticleProvider {
  constructor(
    private readonly articleRepository: ArticleRepository,
    private readonly keyProvider: KeyProvider,
  ) {}

  async create(object: ReduceSearchResultTwo, article: string, userId: string) {
    const keys = await this.keyProvider.createKey(object.data, article, userId);
    const data = await this.articleRepository.create({
      userId: userId,
      article: article,
      city: object.city,
      city_id: object._id,
      keys: keys,
      productName: 'product',
    });

    return data;
  }
}
