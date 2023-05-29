import { Injectable } from '@nestjs/common';
import { StatisticProvider } from './providers/statistic.provider';
import { CreateStatisticDto, RemoveArticleDto } from './dto';
import { FetchProvider } from './providers/fetch.provider';
import { ArticleRepository } from './repositories';
import { FindDataDto } from './dto/find-data.dto';
import { AddKeysDto } from './dto/add-keys.dto';
import { KeyProvider } from './providers/key.provider';
import { RemoveKeyDto } from './dto/remove-key.dto';
import { ParsersData } from './providers/utils/parse.utils';
import { PwzRepository } from './repositories/pwz.repository';
import { map } from 'lodash';
import { CalculateUtils } from './providers/utils/calculate.utils';
import { PeriodRepository } from './repositories/periods.repository';

@Injectable()
export class StatisticService {
  parse: ParsersData;
  calculate: CalculateUtils;
  constructor(
    private readonly statisticProvider: StatisticProvider,
    private readonly keyProvider: KeyProvider,
    private readonly articleRepository: ArticleRepository,
    private readonly fetchProvider: FetchProvider,
    private readonly periodRepository: PeriodRepository,
    private readonly pwzRepository: PwzRepository,
  ) {
    this.parse = new ParsersData();
    this.calculate = new CalculateUtils();
  }

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

    const result = await this.parse.formatData(resultSearch);

    return await this.statisticProvider.create({
      userId: userId,
      article: article,
      dataSearch: result,
    });
  }

  async findByCity(data: FindDataDto) {
    return await this.articleRepository.findByCity(data);
  }

  async addKeyByArticleFromCity(dataKey: AddKeysDto) {
    const { article, keys, cityId } = dataKey;
    const towns = await this.articleRepository.findByCityFromAddKeys(dataKey);
    const search = await this.searchKey({
      pwz: towns.keys[0],
      article: article,
      keys: keys,
    });

    const resolved = await Promise.all(search);
    const result = await this.parse.mergedData(resolved);
    const keyId = await this.keyProvider.createKey(result, article, cityId);
    const update = await this.articleRepository.updateArticle(keyId, towns._id);

    return update;
  }

  async removeArticle(data: RemoveArticleDto) {
    return await this.articleRepository.removeArticle(data);
  }

  async removeKey(data: RemoveKeyDto) {
    return await this.articleRepository.removeKeyByArticle(data);
  }

  async searchKey(data: { pwz; article: string; keys: string[] }) {
    const result = map(data.pwz.pwz, async values => {
      console.log('map', data.keys)
      const search = await this.fetchProvider.fetchSearchKey(
        values,
        data.article,
        data.keys,
      );
      return search;
    });

    return result;
  }

  async cronUpdate() {
    const articles = await this.articleRepository.findAll();

    const articlesMapping = map(articles, async article => {
      const parseArticle = await this.parse.fetchFormattedData(article);
      return parseArticle;
    });

    const resolvedMapping = await Promise.all(articlesMapping);

    const dataUpdated = resolvedMapping.flat();

    let iterator = 0;
    while (dataUpdated.length > iterator) {
      const fetch = await this.fetchProvider.fetchSearchKey(
        {
          _id: dataUpdated[iterator]._id,
          name: dataUpdated[iterator].address,
        },
        dataUpdated[iterator].article,
        dataUpdated[iterator].keys,
      );

      const position = fetch.data[0].result.position;
      const getPwz = await this.pwzRepository.findById(
        dataUpdated[iterator]._id,
      );

      const lastPosition = getPwz.position.at(-1);

      const calc = await this.calculate.difference(lastPosition, position);
      const addPeriod = await this.periodRepository.create(position, calc);
      await this.pwzRepository.update(addPeriod, dataUpdated[iterator]._id);

      iterator += 1;
    }
  }
}
