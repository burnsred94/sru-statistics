import { Injectable } from '@nestjs/common';
import { StatisticProvider } from './providers/statistic.provider';
import { CreateStatisticDto } from './dto';
import { FetchProvider } from './providers/fetch.provider';
import { ICreateRequest } from '../interfaces/requested/create-requested.interface';
import { forEach, map } from 'lodash';

@Injectable()
export class StatisticService {
  constructor(
    private readonly statisticProvider: StatisticProvider,
    private readonly fetchProvider: FetchProvider,
  ) {}

  async create(data: CreateStatisticDto) {
    const { telegramId, towns, article, keys, email } = data;
    const resultSearch = [];
    let iterator = 0;

    while (towns.length > iterator) {
      const search = await this.fetchProvider.fetchSearch(
        towns[iterator],
        article,
        keys,
      );
      resultSearch.push(search);
      iterator++;
    }
    const dataForCreate = resultSearch.flat() as ICreateRequest[];

    const dataReduce = dataForCreate.reduce((accumulator, item) => {
      if (item !== undefined || item.data !== undefined) {
        const city = item.city;
        if (!accumulator[city]) {
          accumulator[city] = [];
        }
        accumulator[city].push(item.data);
        return accumulator;
      }
    }, {});

    const result = [];
    Object.keys(dataReduce).forEach((key: string | number) => {
      const object = {
        city: key,
        _id: dataForCreate.find(index => index.city === key)._id,
        data: dataReduce[key],
      };
      result.push(object);
    });

    return await this.statisticProvider.create({
      telegramId: telegramId,
      article: article,
      email: email,
      dataSearch: result,
    });
  }
}
