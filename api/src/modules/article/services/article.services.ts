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
import { FetchProvider } from 'src/modules/fetch/provider';
import { DEFAULT_PRODUCT_NAME } from '../constants';
import { KeysService } from 'src/modules/keys';
import { TownsDestructor } from '../utils';
import { compact } from 'lodash';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventsParser, EventsWS } from '../events';

@Injectable()
export class ArticleService {
  protected readonly logger = new Logger(ArticleService.name);

  constructor(
    private readonly articleRepository: ArticleRepository,
    private readonly fetchProvider: FetchProvider,
    private readonly keyService: KeysService,
    private readonly utilsDestructor: TownsDestructor,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  async checkData(user: User) {
    return await this.articleRepository.findDataByUser(user);
  }

  //Cделано
  async create(data: CreateArticleDto, user: User) {
    //TODO: Разбить на блоки
    // 1. Блок поиска артикула который у нас есть, если есть то мы смотрим на разницу ключей те которые совпадают мы их активируем тех которых нету то отправляем на парсинг
    // 2. Блок поиска удаленных артикулов с неактивными ключами, если мы находим его то смотрим на совпадение ключей
    // 3. Блок получение информации для нового артикула и деструкторизации даных
    const { article, keys } = data;
    const findArticleActive = await this.articleRepository.findArticleActive(article, user);

    if (findArticleActive) {
      await this.addKeys({ articleId: String(findArticleActive._id), keys: keys }, user);
      return findArticleActive;
    }

    const findArticleNonActive = await this.articleRepository.findArticleNonActive(article, user); // TODO: Сделать активацию дупликации ключей

    if (findArticleNonActive) {
      setImmediate(async () => {
        await this.articleRepository.backOldArticle(
          findArticleNonActive._id,
          user,
        );
        this.eventEmitter.emit(EventsWS.SEND_ARTICLES, { userId: user });
      });
    }

    const productNameData = await this.fetchProvider.fetchArticleName(article);

    const towns = await this.fetchProvider.fetchProfileTowns(user);
    const destructTowns = await this.utilsDestructor.destruct(towns);

    setImmediate(async () => {
      const newKeys = await this.keyService.create({
        pvz: destructTowns,
        keys: keys,
        userId: user,
        article: article,
      });

      await this.articleRepository.create({
        productImg: productNameData.status ? productNameData.img : null,
        productRef: productNameData.status ? productNameData.product_url : null,
        userId: user,
        article: data.article,
        active: true,
        productName: productNameData.status ? productNameData.product_name : DEFAULT_PRODUCT_NAME,
        keys: newKeys,
      });

      this.eventEmitter.emit(EventsParser.SEND_TO_PARSE, { keysId: newKeys });

      await this.fetchProvider.startTrialPeriod(user);

      this.eventEmitter.emit(EventsWS.SEND_ARTICLES, { userId: user })
    })
  }

  //Cделано
  async findByCity(data: FindByCityDto, id: number, query: FindByCityQueryDto[]) {
    const payload = await this.articleRepository.findByCity(data, id, query);
    return compact(payload).reverse();
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
    await this.fetchProvider.fetchParser({ keysId: newKeys });
  }

  //Cделано
  async removeArticle(data: RemoveArticleDto, id: User) {
    await this.articleRepository.removeArticle(data, id);
  }

  //Cделано
  async removeKey(data: RemoveKeyDto, user: User) {
    await this.keyService.removeKey(data.keyId);
  }
}
