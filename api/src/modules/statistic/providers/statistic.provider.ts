import { Injectable } from '@nestjs/common';
import {
  ArticleRepository,
  KeysRepository,
  StatisticRepository,
} from '../repositories';
import {
  IDestructionResult,
  ReduceSearchResult,
  Result,
} from 'src/modules/interfaces/requested/create-requested.interface';
import { compact, forEach, map, merge } from 'lodash';
import { PwzRepository } from '../repositories/pwz.repository';
import { PeriodsEntity } from '../entity/period.entity';
import { Types } from 'mongoose';

@Injectable()
export class StatisticProvider {
  constructor(
    private readonly articleRepository: ArticleRepository,
    private readonly keysRepository: KeysRepository,
    private readonly statisticRepository: StatisticRepository,
    private readonly pwzRepository: PwzRepository,
  ) { }

  async create(data: IDestructionResult) {
    const { article, email, telegramId, dataSearch } = data;

    const result = this.createStatistics(data);

    const resultData = result.then((yes) => {
      if (yes) {
        const find = this.articleRepository.findOne({
          article: article,
          email: email,
          telegramId: telegramId,
        })
        return find.then((articles) => articles)
      }
    })


    return resultData


  }

  async createStatistics(data) {
    const { article, email, telegramId, dataSearch } = data;
    const dataParse = await this.parse(dataSearch);

    forEach(dataParse, valueObject => {
      const keys = [] as unknown as [Types.ObjectId];
      forEach(valueObject.data, (valueData, indexData) => {
        const pwzs = [] as unknown as [Types.ObjectId];
        forEach(
          valueData.result as unknown as Result[],
          async (valueResult, indexResult) => {
            const result = valueData.result as unknown as Result[];

            const period = new PeriodsEntity(valueResult.position);
            const pwz = await this.pwzRepository.create({
              article: article,
              name: valueResult.address,
              position: [period],
              telegramId: telegramId,
              email: email,
            });
            if (pwz) pwzs.push(pwz._id);

            if (result.length === indexResult + 1) {
              const key = await this.keysRepository.create({
                article: article,
                key: valueData.key,
                pwz: pwzs,
                address: valueResult.address,
                email: email,
                telegramId: telegramId,
              });
              if (key) keys.push(key._id);

              if (valueObject.data.length === indexData + 1) {
                await this.articleRepository.create({
                  city: valueObject.city,
                  email: email,
                  telegramId: telegramId,
                  city_id: valueObject._id,
                  keys: keys,
                  productName: 'product',
                  article: article,
                });
              }
            }
          },
        );
      });
    });

    return true;
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
