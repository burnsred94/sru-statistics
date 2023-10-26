import { Injectable, Logger } from '@nestjs/common';
import { User } from 'src/modules/auth';
import { ArticleRepository } from '../../repositories';
import { FetchProvider } from 'src/modules/fetch';
import { TownsDestructor } from '../../utils';
import { Keys, KeysService } from '../../../keys';
import { MessagesEvent } from 'src/interfaces';
import { GetProductRMQ } from 'src/modules/rabbitmq/contracts/products';
import { DEFAULT_PRODUCT_NAME } from '../../constants';
import { Types } from 'mongoose';
import { PaginationService } from 'src/modules/structures/pagination';

/// Сделать когда возрващаються ключи проверить на актуальность позиции

@Injectable()
export class CreateArticleStrategy {
  protected readonly logger = new Logger(CreateArticleStrategy.name);

  constructor(
    private readonly articleRepository: ArticleRepository,
    private readonly fetchProvider: FetchProvider,
    private readonly paginationService: PaginationService,
    private readonly utilsDestructor: TownsDestructor,
    private readonly keyService: KeysService,
  ) { }

  async findNotActiveAddKeys(article: string, keys, user) {
    const find_product = await this.articleRepository.findOne(
      { article, userId: user, active: false },
      { path: 'keys', select: 'active key', match: { active: false }, model: Keys.name },
    );

    if (!find_product) {
      return false;
    }

    if (find_product.keys.length > 0) {
      const matchToNotActive = await this.utilsDestructor.matchKeysNotActive(
        keys,
        find_product.keys,
      );

      matchToNotActive.length > 0
        ? setImmediate(
          async () =>
            await this.keyService.updateMany(matchToNotActive as Array<Types.ObjectId>, {
              active: true,
            }),
        )
        : null;

      await this.articleRepository.findOneAndUpdate(
        { _id: find_product._id, userId: user },
        { $set: { active: true } },
      );
      this.logger.log(`Product activate article: ${article}, id: ${find_product._id}`);

      const active_product = await this.articleRepository.findOne(
        { article, userId: user },
        { path: 'keys', select: 'active key', match: { active: true }, model: Keys.name },
      );
      const matchToActiveKeys = await this.utilsDestructor.matchKeys(keys, active_product.keys);

      if (matchToActiveKeys.length > 0)
        await this.actionKey({ keys: matchToActiveKeys, article }, active_product._id._id, user);

      return { event: MessagesEvent.ENABLED_ARTICLE };
    }
  }

  async checkArticleAddKeys(article: string, keys, user: User) {
    const find_keys_active = await this.articleRepository.findOne(
      { article, userId: user },
      { path: 'keys', select: 'active key', model: Keys.name },
    );

    if (!find_keys_active) return false;

    let countAll = 0;
    let countActivate = 0;
    const matchToActiveKeys = await this.utilsDestructor.matchKeys(keys, find_keys_active.keys);
    countAll += matchToActiveKeys.length;

    const find_keys_not_active = await this.articleRepository.findOne(
      { article, userId: user },
      { path: 'keys', select: 'active key', match: { active: false }, model: Keys.name },
    );

    console.log(find_keys_not_active);

    if (find_keys_not_active.keys.length > 0) {
      const matchToNotActive = await this.utilsDestructor.matchKeysNotActive(
        keys,
        find_keys_not_active.keys,
      );
      console.log(`matchToNotActive`, matchToNotActive, matchToActiveKeys);
      countActivate += matchToNotActive.length;

      matchToNotActive.length > 0
        ? setImmediate(
          async () =>
            await this.keyService.updateMany(matchToNotActive as Array<Types.ObjectId>, {
              active: true,
            }),
        )
        : null;

      await this.actionKey({ keys: matchToActiveKeys, article }, find_keys_active._id._id, user);

      return { count_all: countAll, count_activate: countActivate, event: MessagesEvent.ADD_KEYS };
    }

    await this.actionKey({ keys: matchToActiveKeys, article }, find_keys_active._id._id, user);

    return { count_all: countAll, event: MessagesEvent.NOT_ADDED_KEYS };
  }

  async createNewArticle(article: string, keys, user: User, product: GetProductRMQ.Response) {

    const newArticle = await this.articleRepository.create({
      productImg: product.status ? product.img : null,
      productRef: product.status ? product.product_url : null,
      userId: user,
      article: article,
      active: true,
      productName: product.status ? product.product_name : DEFAULT_PRODUCT_NAME,
    });

    const pagination = await this.paginationService.create({
      key_limit: 10,
      page: 1,
      article_id: newArticle.id,
    });

    await this.articleRepository.findOneAndUpdate(
      { _id: pagination.article_id },
      { pagination: pagination._id },
    );

    await this.actionKey({ keys, article }, newArticle._id, user);

    return { event: MessagesEvent.CREATE_ARTICLES };
  }

  private async actionKey(
    data: { keys: string[]; article: string },
    id: Types.ObjectId,
    user: User,
  ): Promise<void> {
    setImmediate(async () => {
      const towns = await this.fetchProvider.fetchProfileTowns(user);
      const destructTowns = await this.utilsDestructor.destruct(towns);

      await this.keyService.create(
        {
          pvz: destructTowns,
          keys: data.keys,
          userId: user,
          article: data.article,
        },
        id,
      );
    });
  }
}
