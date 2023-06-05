import { BadRequestException, Injectable, Logger } from '@nestjs/common';
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
import { filter, find, forEach, map } from 'lodash';
import { CalculateUtils } from './providers/utils/calculate.utils';
import { PeriodRepository } from './repositories/periods.repository';
import { GetOneDto } from './dto/get-one-article.dto';
import { User } from '../auth/user';
import {
  ARTICLE_DUPLICATE,
  FILED_SEARCH_PRODUCT,
  KEY_DUPLICATE,
} from 'src/constatnts/errors.constants';

@Injectable()
export class StatisticService {
  protected readonly logger = new Logger(StatisticService.name);

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

  async merge(id: User, statisticData) {
    if (statisticData === undefined) return null;
    const { data } = await this.fetchProvider.fetchProfile(id);

    const result = map(statisticData, async item => {
      const checkProfile = find(
        data.towns,
        town => town.city_id === item.city_id,
      );

      if (checkProfile) {
        const { keys } = item;
        const { addresses } = checkProfile;
        const keysData = await this.keysMergeIterations(
          keys,
          addresses,
          item,
          id,
        );
        return keysData;
      }
    });

    const resolved = await Promise.all(result);
    return resolved;
  }

  async keysMergeIterations(keys, addresses, item, _id) {
    const mapping = map(
      keys,
      async key =>
        await this.mergeIterationsKey(key, addresses, item.article, _id),
    );

    const resolved = await Promise.all(mapping);
    return resolved;
  }

  async mergeIterationsKey(key, addresses, article, id) {
    const { pwz } = key;

    const mapping = map(addresses, async item => {
      const checkAddress = find(pwz, pwzItem => pwzItem.name === item.address);
      if (!checkAddress) {
        const searching = await this.fetchProvider.fetchSearchKey(
          { _id: key._id, name: item.address as string },
          article,
          [key.key],
        );
        const { data, _id } = searching;
        const period = await this.periodRepository.create(
          data[0].result.position,
        );

        const pwz = await this.pwzRepository.create({
          userId: id,
          article: article,
          name: item.address,
          position: [period],
        });
        const updateKey = await this.keyProvider.updateKey(_id, pwz);
        return updateKey;
      }
    });

    forEach(pwz, async value => {
      const check = find(addresses, item => item.address === value.name);
      if (!check) {
        forEach(value.position, async pos => {
          await this.periodRepository.deleteById(pos._id);
        });
        await this.pwzRepository.deleteById(value._id);
      }
    });

    const resolved = await Promise.all(mapping);
    return resolved;
  }

  async getOneArticle(dto: GetOneDto) {
    return await this.articleRepository.findOneArticle(dto, false);
  }

  async create(data: CreateStatisticDto, userId: User) {
    const { towns, article, keys } = data;
    const checkArticle = await this.fetchProvider.fetchArticleName(article);

    if (towns.length > 1) {
      for (const element of towns) {
        const findArticleByUser = await this.articleRepository.findOneArticle(
          { userId: userId, article: article, cityId: element._id },
          true,
        );

        if (findArticleByUser !== null) {
          throw new BadRequestException(ARTICLE_DUPLICATE);
        }
      }
    } else {
      const findArticleByUser = await this.articleRepository.findOneArticle(
        { userId: userId, article: article, cityId: towns[0]._id },
        true,
      );

      if (findArticleByUser !== null) {
        throw new BadRequestException(ARTICLE_DUPLICATE);
      }
    }

    const lt = JSON.parse(checkArticle.body);

    if (lt.status === 400) {
      this.logger.error(lt.errors[0].message);
      throw new BadRequestException(FILED_SEARCH_PRODUCT);
    }

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
      productName: lt.data.product_name,
    });
  }

  async findByCity(data: FindDataDto, user: User) {
    return await this.articleRepository.findByCity(data, user);
  }

  async addKeyByArticleFromCity(dataKey: AddKeysDto, userId: User) {
    const { article, keys, cityId } = dataKey;

    for (const element of keys) {
      const findArticle = await this.articleRepository.finCityArticle(
        article,
        userId,
        cityId,
      );
      for (let index = 0; findArticle.keys.length > index; index++) {
        const findKey = await this.keyProvider.findKeyUser(
          findArticle.keys[index]._id,
        );
        if (findKey.key === element) {
          throw new BadRequestException(KEY_DUPLICATE);
        }
      }
    }

    const towns = await this.articleRepository.findByCityFromAddKeys(
      dataKey,
      userId,
    );

    const search = await this.searchKey({
      pwz: towns.keys[0],
      article: article,
      keys: keys,
    });

    const resolved = await Promise.all(search);
    const result = await this.parse.mergedData(resolved);
    const keyId = await this.keyProvider.createKey(result, article, userId);
    const update = await this.articleRepository.updateArticle(keyId, towns._id);

    return update;
  }

  async removeArticle(data: RemoveArticleDto, user: User) {
    return await this.articleRepository.removeArticle(data, user);
  }

  async removeKey(data: RemoveKeyDto, user: User) {
    const removeArticle = await this.articleRepository.removeKeyByArticle(
      data,
      user,
    );
    if (removeArticle) {
      const deleteKey = await this.keyProvider.deleteKey(data.keyId);
      return deleteKey;
    } else {
      return removeArticle;
    }
  }

  async searchKey(data: { pwz; article: string; keys: string[] }) {
    const result = map(data.pwz.pwz, async values => {
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
