import { Injectable } from '@nestjs/common';
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
import { FetchProvider } from 'src/modules/fetch/provider';
import { DEFAULT_PRODUCT_NAME } from '../constants';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventsParser, EventsWS } from '../events';
import { KeysService } from 'src/modules/keys';
import { TownsDestructor } from '../utils';

@Injectable({})
export class ArticleService {
  constructor(
    private readonly articleRepository: ArticleRepository,
    private readonly fetchProvider: FetchProvider,
    private readonly keyService: KeysService,
    private readonly utilsDestructor: TownsDestructor,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  //Cделано, осталось добавить запросы на парсер
  async create(data: CreateArticleDto, user: User) {
    const { article, keys } = data;
    const { data: productNameData } = await this.fetchProvider.fetchArticleName(
      article,
    );
    const towns = await this.fetchProvider.fetchProfileTowns(user);
    const destructTowns = await this.utilsDestructor.destruct(towns);

    const newKeys = await this.keyService.create({
      pvz: destructTowns,
      keys: keys,
      userId: user,
      article: article,
    });

    const newArticle = await this.articleRepository.create({
      productImg: productNameData.status ? productNameData.img : '',
      productRef: productNameData.status ? productNameData.product_url : '',
      userId: user,
      article: data.article,
      active: true,
      productName: productNameData.status
        ? productNameData.product_name
        : DEFAULT_PRODUCT_NAME,
      keys: newKeys,
    });

    this.eventEmitter.emit(EventsWS.CREATE_ARTICLE, { userId: user });
    this.eventEmitter.emit(EventsParser.SEND_TO_PARSE, { keysId: newKeys });

    return newArticle;
  }

  //Cделано
  async findByCity(data: FindByCityDto, id: number, query: FindByCityQueryDto) {
    return await this.articleRepository.findByCity(data, id, query);
  }

  //Cделано
  async addKeys(data: AddKeyDto, user: User): Promise<void> {
    const { articleId, keys } = data;
    const find = await this.articleRepository.findById(articleId);
    const towns = await this.fetchProvider.fetchProfileTowns(user);
    const destructTowns = await this.utilsDestructor.destruct(towns);

    const newKeys = await this.keyService.create({
      pvz: destructTowns,
      keys: keys,
      userId: user,
      article: find.article,
    });

    await this.articleRepository.update(newKeys, find._id);

    this.eventEmitter.emit(EventsWS.ADDED_KEYS, { userId: user });
  }

  //Cделано
  async removeArticle(data: RemoveArticleDto, id: User) {
    await this.articleRepository.removeArticle(data, id);

    this.eventEmitter.emit(EventsWS.REMOVE_ARTICLE, { userId: id });
  }

  //Cделано
  async removeKey(data: RemoveKeyDto, user: User) {
    await this.keyService.removeKey(data.keyId);

    this.eventEmitter.emit(EventsWS.REMOVE_KEY, {
      userId: user,
    });
  }
}
