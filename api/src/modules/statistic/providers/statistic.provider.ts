import { Injectable } from '@nestjs/common';
import {
  IDestructionResult,
  ReduceSearchResult,
  ReduceSearchResultTwo,
  Result,
} from 'src/modules/interfaces/requested/create-requested.interface';
import { ArticleProvider } from './article-provider.provider';
import { compact, map } from 'lodash';

@Injectable()
export class StatisticProvider {
  constructor(private readonly articleProvider: ArticleProvider) {}

  async create(data: IDestructionResult) {
    const result = await this.createStatistics(data);

    return result;
  }

  async createStatistics(data: IDestructionResult) {
    const { article, dataSearch, userId } = data;
    const dataParse = await this.parse(dataSearch);

    const createArticle = map(
      dataParse,
      async (object: ReduceSearchResultTwo) => {
        return await this.articleProvider.create(object, article, userId);
      },
    );

    return await Promise.all(createArticle);
  }

  async parse(dataSearch: ReduceSearchResult[]) {
    const result = map(dataSearch.flat(), value => {
      const { data } = value;

      return {
        city: value.city,
        _id: value._id,
        data: compact(data).reduce((accumulator, array) => {
          array.forEach(object => {
            const index = accumulator.findIndex(
              item => item.key === object.key,
            );
            if (index === -1) {
              accumulator.push({
                key: object.key,
                result: [object.result] as Result[],
              });
            } else {
              const accumulatorResult = accumulator[index].result as Result[];
              accumulatorResult.push(object.result as Result);
            }
          });
          return accumulator;
        }, []),
      };
    });

    return result;
  }
}
