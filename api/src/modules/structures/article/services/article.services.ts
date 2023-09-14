import { Injectable, Logger } from '@nestjs/common';
import { ArticleRepository } from '../repositories';
import {
  AddKeyDto,
  CreateArticleDto,
  RemoveKeyDto,
  RemoveArticleDto,
} from '../dto';
import { User } from 'src/modules/auth';
import { Keys, KeysService } from '../../keys';
import { TownsDestructor } from '../utils';
import { chunk, map } from 'lodash';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { EventsWS } from '../events';
import { GetProductRMQ } from 'src/modules/rabbitmq/contracts/products';
import { MessagesEvent } from 'src/interfaces';
import { CreateArticleStrategy } from './create';
import { FilterQuery, HydratedDocument, Types } from 'mongoose';
import { Article } from '../schemas';
import { Pvz } from '../../pvz';
import { StatisticsGetArticlesRMQ } from 'src/modules/rabbitmq/contracts/statistics';
import { Periods } from '../../periods';

@Injectable()
export class ArticleService {
  protected readonly logger = new Logger(ArticleService.name);

  constructor(
    private readonly createArticleStrategy: CreateArticleStrategy,
    private readonly articleRepository: ArticleRepository,
    private readonly keyService: KeysService,
    private readonly utilsDestructor: TownsDestructor,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  ///Получение артикулов для разводящей
  async articles(id: User, query) {
    const list = await this.articleRepository.findList(id, query.search, query.sort);
    return { articles: list.articles, count_keys: await this.keyService.count({ active: true, userId: id }) }
  }

  //Переделать на более оптимизированный запрос
  async create(data: CreateArticleDto, user: User, product?: GetProductRMQ.Response) {
    try {
      const keys = await this.utilsDestructor.keysFilter(data.keys);

      const checkProduct = await this.createArticleStrategy.findNotActiveAddKeys(
        data.article,
        keys,
        user,
      );
      if (checkProduct) return checkProduct;

      const checkKeys = await this.createArticleStrategy.checkArticleAddKeys(
        data.article,
        keys,
        user,
      );
      if (checkKeys) return checkKeys;

      return await this.createArticleStrategy.createNewArticle(data.article, keys, user, product);
    } catch (error) {
      return error.message;
    }
  }

  //Нужен для Метрики
  async findOne(filterQuery: FilterQuery<Article>) {
    return await this.articleRepository.findOne(filterQuery);
  }

  //Поиск одного артикула
  async findArticle(_id: Types.ObjectId, query) {
    const data = await this.articleRepository.findArticle({ _id: _id }, query);
    const total_keys = data.keys.length;

    //Временное событие
    this.eventEmitter.emitAsync('metric.checked', { article: data._id, user: data.userId });

    let keys: Types.ObjectId[],
      page: number,
      total: number,
      page_size: number;

    const pagination = <{ key_limit: number, _id: Types.ObjectId, page: number }><unknown>data.pagination

    const chunks = chunk(data.keys, pagination.key_limit);

    if (chunks[pagination.page]) {
      keys = chunks[pagination.page],
        page = pagination.page,
        total = chunks.length,
        page_size = pagination.key_limit;
    } else {
      keys = chunks[0],
        page = 1,
        total = chunks.length,
        page_size = pagination.key_limit;
    }

    return {
      article: {
        ...data, keys,
      },
      meta: {
        page, total, page_size,
      },
      total_keys,
    }
  }

  //Оптимизируется после создания
  async addKeys(data: AddKeyDto, user: User) {
    const { articleId, keys } = data;
    let find: HydratedDocument<Article> = await this.articleRepository.findOne({ _id: articleId });

    find = await find.populate({
      path: 'keys',
      select: 'pwz key userId',
      model: Keys.name,
      populate: { path: 'pwz', select: 'name', model: Pvz.name },
    });

    const message = await this.create({ article: find.article, keys: keys }, user);

    return {
      message,
      article: find.article,
    };
  }

  //Переделать на более оптимизированный запрос, добавить событие
  async removeArticle(data: RemoveArticleDto, id: User) {
    const result = map(data.articleId, async element => {
      const article = await this.articleRepository.findOneAndUpdate(
        {
          _id: element, userId: id,
        },
        {
          active: false,
        }
      );

      const removedKey = await this.keyService.updateMany(article.keys, { active: false });

      if (removedKey) {
        return article.article;
      }
    });
    const resolved = await Promise.all(result);
    return { article: resolved, event: MessagesEvent.DELETE_ARTICLES };
  }

  //Дописать что бы не удалялся последний ключ
  async removeKey(data: RemoveKeyDto, user: User) {
    // const getKey = await this.keyService.findById([{ _id: data.keyId, active: true }], 'all');

    return await this.keyService.removeKey(data.keyId).then(data => {
      if (data) {
        this.eventEmitter.emit(EventsWS.SEND_ARTICLES, { userId: user });
        return {
          event: MessagesEvent.DELETE_KEY,
          article: data.article,
          key: data.key,
        };
      }
    });
  }

  //Поиск артикулов для выгрузки в Excel
  async getArticlesUpload(payload: StatisticsGetArticlesRMQ.Payload) {
    return await this.articleRepository.find({ _id: payload.articles, userId: payload.userId }, {
      path: 'keys',
      select: 'key frequency pwz',
      match: { active: true },
      model: Keys.name,
      populate: {
        path: 'pwz',
        select: 'city position',
        model: Pvz.name,
        populate: {
          path: 'position',
          select: 'position cpm promo_position timestamp difference',
          match: { timestamp: { $in: payload.periods } },
          model: Periods.name
        }
      }
    });
  }

  //добовление ключей 
  @OnEvent('keys.update')
  async update(payload) {
    await this.articleRepository.findOneAndUpdate({ _id: payload.id }, {
      $push: {
        keys: payload.key,
      },
    });
  }

  @OnEvent('pagination.create')
  async updatePagination(payload: { pagination_id: Types.ObjectId, article_id: Types.ObjectId }) {
    await this.articleRepository.findOneAndUpdate({ _id: payload.article_id }, { pagination: payload.pagination_id });
  }
}
