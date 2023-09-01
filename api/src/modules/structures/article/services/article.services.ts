import { Injectable, Logger } from '@nestjs/common';
import { ArticleRepository } from '../repositories';
import {
  AddKeyDto,
  CreateArticleDto,
  FindByCityDto,
  FindByCityQueryDto,
  RemoveKeyDto,
  RemoveArticleDto,
} from '../dto';
import { User } from 'src/modules/auth';
import { KeysService } from '../../keys';
import { TownsDestructor } from '../utils';
import { compact, map } from 'lodash';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventsWS } from '../events';
import { GetProductRMQ } from 'src/modules/rabbitmq/contracts/products';
import { MessagesEvent } from 'src/interfaces';
import { CreateArticleStrategy } from './create';
import { Types } from 'mongoose';

@Injectable()
export class ArticleService {
  protected readonly logger = new Logger(ArticleService.name);

  constructor(
    private readonly createArticleStrategy: CreateArticleStrategy,
    private readonly articleRepository: ArticleRepository,
    private readonly keyService: KeysService,
    private readonly utilsDestructor: TownsDestructor,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  //Удалить после обновления
  async checkData(user: User) {
    return await this.articleRepository.findDataByUser(user);
  }

  async articles(id: User) {
    return {
      articles: await this.articleRepository.findByUser(id),
      count_keys: await this.keyService.countUserKeys(id, true),
    };
  }

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

  async findOne(_id: Types.ObjectId) {
    return await this.articleRepository.findOne({ _id: _id });
  }

  async findByCity(data: FindByCityDto, id: number, query: FindByCityQueryDto[]) {
    const payload = await this.articleRepository.findByCity(data, id, query);
    return compact(payload).reverse();
  }

  async addKeys(data: AddKeyDto, user: User) {
    const { articleId, keys } = data;
    const find = await this.articleRepository.findById(articleId);
    const message = await this.create({ article: find.article, keys: keys }, user);

    return {
      message,
      article: find.article,
    };
  }

  async removeArticle(data: RemoveArticleDto, id: User) {
    const result = map(data.articleId, async element => {
      const article = await this.articleRepository.removeArticle(element, id);
      const removedKey = await this.keyService.updateMany(article.keys);

      if (removedKey) {
        return article.article;
      }
    });
    const resolved = await Promise.all(result);
    return { article: resolved, event: MessagesEvent.DELETE_ARTICLES };
  }

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
}
