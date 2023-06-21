import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { FetchSearchProvider } from 'src/modules/fetch';
import { IKeyResult, KeysService } from 'src/modules/keys';
import { ArticleService } from '../services';
import { RedisProcessorsArticleEnum, RedisQueueEnum } from 'src/redis-queues';
import { chain, chunk, flatMap, forEach, map, reduce } from 'lodash';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventsWS } from '../gateways/events';
import { IAddressProfile, ITownProfile } from '../interfaces';
import { PvzService } from 'src/modules/pvz';
import { MockGenerator } from 'src/modules/keys/utils';

@Processor({
  name: RedisQueueEnum.ARTICLE_QUEUE,
})
export class ArticleProcessor {
  constructor(
    private readonly fetchSearchProvider: FetchSearchProvider,
    private readonly articleService: ArticleService,
    private readonly mockGenerator: MockGenerator,
    private readonly pvzService: PvzService,
    private readonly keysService: KeysService,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  @Process({
    name: RedisProcessorsArticleEnum.FIND_ALL_BY_USER,
    concurrency: 1000,
  })
  async processFindAll(job) {
    const { find, query, data } = job.data;

    const accumulator = reduce(
      find,
      (accumulator, current) => {
        if (accumulator.length === 0) {
          accumulator.push({
            ids: [{ _id: current._id, city: current.city }],
            article: current.article,
            productName: current.productName,
            productRef: current.productRef,
            productImg: current.productImg,
            keys: current.keys,
          });
        } else {
          const index = accumulator.findIndex(
            item => item.article === current.article,
          );

          if (index === -1) {
            accumulator.push({
              ids: [{ _id: current._id, city: current.city }],
              article: current.article,
              productName: current.productName,
              productRef: current.productRef,
              productImg: current.productImg,
              keys: current.keys,
            });
          } else {
            accumulator[index].keys.push(...current.keys);
            accumulator[index].ids.push({ _id: current._id, city: current.city });
          }
        }
        return accumulator;
      },
      [],
    )

    const sortKeys = map(accumulator, (item) => {
      const result = chain(item.keys)
        .groupBy('key')
        .mapValues((group) => {
          const pwz = flatMap(group, 'pwz');
          return { key: group[0].key, pwz };
        })
        .values()
        .value();

      const average = map(result, (element) => {
        const newData = element.pwz.map((value) => {
          return value.position
        })

        const newAverageData = newData.flat().reduce((accumulator, value) => {
          if (accumulator.length === 0) {
            accumulator.push({ _id: value._id, timestamp: value.timestamp, position: String(value.position) });
          } else {
            const index = accumulator.findIndex(element => element.timestamp === value.timestamp);
            if (index === -1) {
              accumulator.push({ _id: value._id, timestamp: value.timestamp, position: String(value.position) })
            } else {
              const firstPos = accumulator[index].position.length > 4 ? 0 : Number(accumulator[index].position)
              const secondPos = value.position.length > 4 ? 0 : Number(value.position);
              accumulator[index].position = firstPos + secondPos
            }
          }
          return accumulator;
        }, [])

        const averageResult = map(newAverageData, (itemTwo) => {
          return {
            _id: itemTwo._id,
            timestamp: itemTwo.timestamp,
            position: itemTwo.position > 0 ? (itemTwo.position / element.pwz.length).toFixed(0) : '2100+'
          }
        })

        return { key: element.key, average: averageResult, pwz: element.pwz };
      });


      return {
        ids: item.ids,
        article: item.article,
        productName: item.productName,
        productRef: item.productRef,
        productImg: item.productImg,
        keys: average,
      }
    })

    const result = map(sortKeys, async (item) => {
      const keyGenerator = map(item.keys, async (value) => {
        const mockData = await this.mockGenerator.keyGenerator(value, data.periods)
        return {
          key: mockData.key,
          average: mockData.average,
          pwz: mockData.pwz
        }
      })

      const resolved = await Promise.all(keyGenerator);
      if (resolved) {
        const chunks = chunk(resolved, query.limit)

        return query.articleId === item.article ?
          {
            ids: item.ids,
            article: item.article,
            productName: item.productName,
            productRef: item.productRef,
            productImg: item.productImg,
            keys: chunks[query.page - 1],
            meta: {
              count: query.page,
              pages_count: chunks.length,
              total_keys: keyGenerator.length,
            },
          } :
          {
            ids: item.ids,
            article: item.article,
            productName: item.productName,
            productRef: item.productRef,
            productImg: item.productImg,
            keys: chunks[0],
            meta: {
              count: 1,
              pages_count: chunks.length,
              total_keys: keyGenerator.length,
            },
          }

      }
    })

    const resolved = await Promise.all(result);
    if (resolved) {
      return resolved
    }
  }

  @Process({
    name: RedisProcessorsArticleEnum.UPDATE_ARTICLE_FROM_PROFILE,
    concurrency: 1000,
  })
  async updateFromProfile(job: Job) {
    const { userId, dataUpdate } = job.data;
    const update = dataUpdate as ITownProfile[];

    const data = map(update, async item => {
      const findDataUpdate = await this.keysService.find({
        userId: userId,
        cityId: item.city_id,
      });
      if (findDataUpdate.length > 0) {
        const dataUpdate = await this.updateDataProfile(
          findDataUpdate,
          item.addresses,
        );
      }
    });
  }

  async updateDataProfile(data, addresses: IAddressProfile[]) {
    const dataResult = [];

    forEach(addresses, async address => {
      await forEach(data, async item => {
        const find = item.pwz.find(p => p.name === address.address);

        if (dataResult.length > 0 && find) {
          const findIndex = dataResult.findIndex(
            element => element._id === item._id,
          );
          if (findIndex === -1) {
            dataResult.push({ _id: item._id, key: item.key, pwz: [find._id] });
          } else {
            dataResult[findIndex].pwz.push(find._id);
          }
        } else if (dataResult.length === 0 && find) {
          dataResult.push({ _id: item._id, key: item.key, pwz: [find._id] });
        } else {
          const { data } = await this.fetchSearchProvider.fetchSearch(
            [{ name: address.address }],
            item.article,
            item.key,
          );
          const newPvz = await this.pvzService.create(
            { address: data[0].address, position: data[0].position },
            item.article,
            item.userId,
          );
          const update = await this.keysService.updateFromProfile(
            item._id,
            newPvz._id,
          );

          if (update) {
            this.eventEmitter.emit(EventsWS.CREATE_ARTICLE, {
              userId: item.userId,
              cityId: item.cityId,
            });
          }
        }
      });
    });

    forEach(dataResult, async item => {
      await this.keysService.pvzUpdate(item._id, item.pwz);
    });
  }

  @Process({
    name: RedisProcessorsArticleEnum.ARTICLE_CREATE,
    concurrency: 1000,
  })
  async createKeys(job: Job) {
    const { pvz, keys, article, articleId, userId, city_id } = job.data.search;

    forEach(keys, async keyName => {
      const keyResult: IKeyResult = await this.fetchSearchProvider.fetchSearch(
        pvz,
        article,
        keyName,
      );

      const key = await this.keysService.create(
        {
          data: keyResult.data,
          key: keyName,
          city_id: city_id,
          userId: userId,
          articleId: articleId,
        },
        article,
      );

      const update = await this.articleService.update(key, articleId);

      if (update) {
        this.eventEmitter.emit(EventsWS.CREATE_ARTICLE, {
          userId: userId,
          cityId: city_id,
        });
      }
    });
  }

  @Process({
    name: RedisProcessorsArticleEnum.ARTICLE_UPDATE_KEY,
    concurrency: 1000,
  })
  async addKey(job: Job) {
    const { filtered, keys } = job.data;

    forEach(filtered, (item) => {
      const filterPvz = item.keys[0].pwz.map(pwz => ({ name: pwz.name }));

      forEach(keys, async keyName => {
        const keyResult: IKeyResult = await this.fetchSearchProvider.fetchSearch(
          filterPvz,
          item.article,
          keyName,
        );

        const key = await this.keysService.create(
          {
            data: keyResult.data,
            key: keyName,
            city_id: item.city_id,
            userId: item.userId,
            articleId: item._id,
          },
          item.article,
        );

        const update = await this.articleService.update(key, item._id);

        if (update) {
          this.eventEmitter.emit(EventsWS.ADDED_KEYS, {
            userId: item.userId,
            cityId: item.city_id,
          });
        }
      });
    })
  }

  @Process({
    name: RedisProcessorsArticleEnum.ARTICLE_UPDATE_STATS_EVERY_DAY,
    concurrency: 1000,
  })
  async updateStats(job: Job) {
    forEach(job.data, async data => {
      const { article, keys } = data;
      const keysData = await this.keysIterator(keys);
      await this.fetchUpdatePwz(article, keysData);
    });
  }

  async fetchUpdatePwz(article: string, keysData) {
    forEach(keysData, async key => {
      const keyResult = await this.fetchSearchProvider.fetchUpdate(
        key.pwz,
        article,
        key.key,
      );

      await this.keysService.update(keyResult, key._id);
    });
  }

  async keysIterator(keys) {
    const keysData = map(keys, async key => {
      const keyUpdate = await this.keyUpdate(key);
      return {
        key: key.key,
        _id: key._id,
        pwz: keyUpdate,
      };
    });

    const resolved = await Promise.all(keysData);
    return resolved;
  }

  async keyUpdate(key) {
    const pwz = map(key.pwz, pwz => {
      return {
        name: pwz.name,
        _id: pwz._id,
        position: pwz.position[-0].position,
      };
    });

    const resolved = await Promise.all(pwz);
    return resolved;
  }
}
