import { Injectable } from '@nestjs/common';
import { StatisticProvider } from './providers/statistic.provider';
import { CreateStatisticDto } from './dto';
import { FetchProvider } from './providers/fetch.provider';
import {
  ICreateRequest,
  IPwz,
  ITown,
} from '../interfaces/requested/create-requested.interface';
import { forEach, map } from 'lodash';
import { ArticleRepository } from './repositories';
import { FindDataDto } from './dto/find-data.dto';
import { AddKeysDto } from './dto/add-keys.dto';
import { KeyProvider } from './providers/key.provider';
import { RemoveKeyDto } from './dto/remove-key.dto';

@Injectable()
export class StatisticService {
  constructor(
    private readonly statisticProvider: StatisticProvider,
    private readonly keyProvider: KeyProvider,
    private readonly articleRepository: ArticleRepository,
    private readonly fetchProvider: FetchProvider,
  ) { }

  async create(data: CreateStatisticDto) {
    const { towns, article, keys, userId } = data;
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
      userId: userId,
      article: article,
      dataSearch: result,
    });
  }

  async getOne(id) {
    return await this.articleRepository.findOne(id);
  }

  async findByCity(data: FindDataDto) {
    return await this.articleRepository.findByCity(data);
  }

  async addKeyByArticleFromCity(dataKey: AddKeysDto) {
    const { article, keys, cityId } = dataKey;
    const towns = await this.articleRepository.findByCityFromAddKeys(cityId);
    //@ts-ignore
    const search = map(towns.keys[0].pwz, async values => {
      const search = await this.fetchProvider.fetchSearchKey(
        values,
        article,
        keys,
      );
      return search;
    });

    const resolved = await Promise.all(search);

    const mergedData = resolved.reduce((accumulator, current) => {
      const existingItem = accumulator.find(
        item => item.data[0].key === current.data[0].key,
      );
      if (existingItem) {
        existingItem.data.push(current.data[0]);
      } else {
        accumulator.push(current);
      }
      return accumulator;
    }, []);

    const resultArray = mergedData.map(item => {
      const result = item.data.map(object => object.result);
      return { key: item.data[0].key, result };
    });

    const keyId = await this.keyProvider.createKey(
      resultArray,
      article,
      cityId,
    );

    const update = await this.articleRepository.updateArticle(keyId, cityId);

    return update;
  }

  async removeArticle(data) {
    return await this.articleRepository.removeArticle(data);
  }

  async removeKey(data: RemoveKeyDto) {
    return await this.articleRepository.removeKeyByArticle(data);
  }
}
