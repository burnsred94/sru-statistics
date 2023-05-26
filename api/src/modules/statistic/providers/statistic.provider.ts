import { Injectable } from '@nestjs/common';
import {
  ArticleRepository,
  KeysRepository,
  StatisticRepository,
} from '../repositories';
import {
  Data,
  IDestructionResult,
  ReduceSearchResult,
  ReduceSearchResultTwo,
  Result,
} from 'src/modules/interfaces/requested/create-requested.interface';
import { compact, forEach, map, merge } from 'lodash';
import { PwzRepository } from '../repositories/pwz.repository';
import { PeriodsEntity } from '../entity/period.entity';
import { Types } from 'mongoose';
import { ArticleProvider } from './article-provider.provider';

@Injectable()
export class StatisticProvider {
  constructor(
    private readonly articleRepository: ArticleRepository,
    private readonly articleProvider: ArticleProvider,
    private readonly statisticRepository: StatisticRepository,
  ) {}

  async create(data: IDestructionResult) {
    const result = await this.createStatistics(data);

    return result;
  }

  async createStatistics(data: IDestructionResult) {
    const { article, email, telegramId, dataSearch } = data;
    const dataParse = await this.parse(dataSearch);

    const createArticle = map(dataParse, (object: ReduceSearchResultTwo) => {
      return this.articleProvider.create(object, article, email, telegramId);
    });

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
