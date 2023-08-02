import { BadRequestException, Injectable, Logger } from '@nestjs/common';
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
import { SenderIoEvent, TownsDestructor } from '../utils';
import { compact } from 'lodash';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventsParser, EventsWS } from '../events';
import { GetProductRMQ } from 'src/modules/rabbitmq/contracts/products';
import { CreateArticleGenerator } from './create';
import { Types } from 'mongoose';
import { MessagesEvent } from 'src/interfaces';

@Injectable()
export class ArticleService {
  protected readonly logger = new Logger(ArticleService.name);

  constructor(
    private readonly articleGenerator: CreateArticleGenerator,
    private readonly articleRepository: ArticleRepository,
    private readonly fetchProvider: FetchProvider,
    private readonly keyService: KeysService,
    private readonly utilsDestructor: TownsDestructor,
    private readonly eventEmitter: EventEmitter2,
    private readonly senderIoEvent: SenderIoEvent,
  ) { }

  async checkData(user: User) {
    return await this.articleRepository.findDataByUser(user);
  }

  //Cделано
  async create(data: CreateArticleDto, user: User, product: GetProductRMQ.Response) {
    try {
      const keys = await this.utilsDestructor.keysFilter(data.keys);

      const checkProduct = this.articleGenerator.findNotActiveAddKeys(data.article, keys, user);
      const checkProductResult = await checkProduct.next();
      if (checkProductResult.value !== null) {
        const status = await checkProduct.next();
        this.logger.log(status.value)
        return await checkProduct.next();
      }

      const checkKeys = this.articleGenerator.checkArticleAddKeys(data.article, keys, user)
      const resultCheckKeys = await checkKeys.next()

      if (resultCheckKeys.value !== null) {
        const result = await checkKeys.next()
        return result.value
      }

      this.articleGenerator.createGeneration(data.article, keys, user, product)

      return { event: MessagesEvent.CREATE_ARTICLES }
    } catch (error) {
      return error.message;
    }
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

    await this.articleRepository.update(newKeys as Types.ObjectId[], find._id);
    await this.fetchProvider.fetchParser({ keysId: newKeys as Types.ObjectId[] });
  }

  //Cделано
  async removeArticle(data: RemoveArticleDto, id: User) {
    await this.articleRepository.removeArticle(data, id);
  }

  //Доделать проверку на последний ключ в артикуле
  async removeKey(data: RemoveKeyDto, user: User) {
    // const getKey = await this.keyService.findById([{ _id: data.keyId, active: true }], 'all')
    await this.keyService.removeKey(data.keyId).then(data => {
      if (data) {
        this.eventEmitter.emit(EventsWS.SEND_ARTICLES, { userId: user });
      }
    });
  }
}
