import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { FetchSearchProvider } from 'src/modules/fetch';
import { IKeyResult, KeysService } from 'src/modules/keys';
import { ArticleService } from '../services';
import { RedisProcessorsArticleEnum, RedisQueueEnum } from 'src/redis-queues';
import { forEach, map } from 'lodash';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventsWS } from '../gateways/events';

@Processor({
  name: RedisQueueEnum.ARTICLE_QUEUE,
})
export class ArticleProcessor {
  constructor(
    private readonly fetchSearchProvider: FetchSearchProvider,
    private readonly articleService: ArticleService,
    private readonly keysService: KeysService,
    private readonly eventEmitter: EventEmitter2,
  ) { }

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

      const key = await this.keysService.create({
        data: keyResult.data,
        key: keyName,
        city_id: city_id,
        userId: userId,
        articleId: articleId,
      });

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
    const { find, keys } = job.data;
    const filterPvz = find.keys[0].pwz.map(pwz => ({ name: pwz.name }));

    forEach(keys, async keyName => {
      const keyResult: IKeyResult = await this.fetchSearchProvider.fetchSearch(
        filterPvz,
        find.article,
        keyName,
      );

      const key = await this.keysService.create({
        data: keyResult.data,
        key: keyName,
        city_id: find.city_id,
        userId: find.userId,
        articleId: find._id,
      });

      const update = await this.articleService.update(key, find._id);

      if (update) {
        this.eventEmitter.emit(EventsWS.ADDED_KEYS, {
          userId: find.userId,
          cityId: find.city_id,
        });
      }
    });
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

      await this.keysService.update(keyResult);
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
