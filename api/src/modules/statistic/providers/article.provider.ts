import { Injectable } from '@nestjs/common';
import { KeyProvider } from './key.provider';
import { ArticleRepository } from '../repositories';
import { ReduceSearchResultTwo } from 'src/modules/interfaces';

@Injectable()
export class ArticleProvider {
  constructor(
    private readonly articleRepository: ArticleRepository,
    private readonly keyProvider: KeyProvider,
  ) {}

  async create(
    object: ReduceSearchResultTwo,
    article: string,
    userId: string,
    productName: string,
  ) {
    const keys = await this.keyProvider.createKey(object.data, article, userId);
    const data = await this.articleRepository.create({
      userId: userId,
      article: article,
      city: object.city,
      city_id: object._id,
      keys: keys,
      productName: productName,
    });

    return data;
  }
}
