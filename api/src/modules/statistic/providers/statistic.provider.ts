import { Injectable } from '@nestjs/common';

import { compact, map } from 'lodash';
import {
  IDestructionResult,
  ReduceSearchResult,
  ReduceSearchResultTwo,
  Result,
} from 'src/modules/interfaces';
import { ArticleProvider } from './article.provider';
import { ParsersData } from './utils/parse.utils';

@Injectable()
export class StatisticProvider {
  parse: ParsersData;

  constructor(private readonly articleProvider: ArticleProvider) {
    this.parse = new ParsersData();
  }

  async create(data: IDestructionResult) {
    const result = await this.createStatistics(data);

    return result;
  }

  async createStatistics(data: IDestructionResult) {
    const { article, dataSearch, userId } = data;
    const dataParse = await this.parse.parseReduce(dataSearch);

    const createArticle = map(
      dataParse,
      async (object: ReduceSearchResultTwo) => {
        return await this.articleProvider.create(object, article, userId);
      },
    );
    return await Promise.all(createArticle);
  }
}
