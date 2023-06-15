import { Injectable } from '@nestjs/common';
import { ArticleRepository } from '../repositories';
import {
  AddKeyDto,
  CreateArticleDto,
  FindByCityDto,
  FindByCityQueryDto,
  RemoveKeyDto,
  UpdateStatusDto,
} from '../dto';
import { User } from 'src/modules/auth';
import { FetchProductProvider } from 'src/modules/fetch/provider';
import { DEFAULT_PRODUCT_NAME } from '../constants';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Types } from 'mongoose';
import { RedisProcessorsArticleEnum, RedisQueueEnum } from 'src/redis-queues';
import { fromEventPattern } from 'rxjs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventsWS } from '../gateways/events';

@Injectable({})
export class ArticleService {
  constructor(
    private readonly articleRepository: ArticleRepository,
    private readonly fetchProductProvider: FetchProductProvider,
    @InjectQueue(RedisQueueEnum.ARTICLE_QUEUE) private articleQueue: Queue,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  async create(data: CreateArticleDto, user: User) {
    const { towns, article, keys } = data;
    const town = towns[0];
    const { data: productNameData } =
      await this.fetchProductProvider.fetchArticleName(article);

    const newArticle = await this.articleRepository.create({
      city: town.city,
      city_id: town._id,
      productImg: productNameData.status ? productNameData.img : '',
      productRef: productNameData.status ? productNameData.product_url : '',
      userId: user,
      article: data.article,
      active: true,
      productName: productNameData.status
        ? productNameData.product_name
        : DEFAULT_PRODUCT_NAME,
    });

    await this.articleQueue.add(RedisProcessorsArticleEnum.ARTICLE_CREATE, {
      search: {
        pvz: town.pwz,
        article: article,
        keys: keys,
        userId: user,
        articleId: newArticle._id,
        city_id: newArticle.city_id,
      },
    });

    return newArticle;
  }

  async update(data: Types.ObjectId, id: Types.ObjectId) {
    await this.articleRepository.update(data, id);
    return true;
  }

  async findByCity(data: FindByCityDto, id: User, query: FindByCityQueryDto) {
    const find = await this.articleRepository.findByCity(data, id, query);
    return find;
  }

  async addKeysByCity(data: AddKeyDto) {
    const { articleId, keys } = data;
    const find = await this.articleRepository.findById(articleId);

    const update = await this.articleQueue.add(
      RedisProcessorsArticleEnum.ARTICLE_UPDATE_KEY,
      {
        find,
        keys,
      },
    );
    return update;
  }

  async updateStatus(data: UpdateStatusDto, id: User) {
    const update = await this.articleRepository.updateStatus(data, id);
    if (update) {
      this.eventEmitter.emit(EventsWS.REMOVE_ARTICLE, {
        userId: update.userId,
        cityId: update.city_id,
      });
    }
  }

  async removeKey(data: RemoveKeyDto, user: User) {
    const removeKey = await this.articleRepository.removeKey(data, user);

    if (removeKey) {
      this.eventEmitter.emit(EventsWS.REMOVE_KEY, {
        userId: user,
      });
    }
  }

  async cronUpdate() {
    const findAll = await this.articleRepository.find();
    await this.articleQueue.add(
      RedisProcessorsArticleEnum.ARTICLE_UPDATE_STATS_EVERY_DAY,
      findAll,
    );
  }
}
