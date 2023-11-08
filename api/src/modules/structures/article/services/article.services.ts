import { BadRequestException, Injectable, Logger, Scope } from '@nestjs/common';
import { ArticleRepository } from '../repositories';
import { AddKeyDto, CreateArticleDto, RemoveKeyDto, RemoveArticleDto } from '../dto';
import { User } from 'src/modules/auth';
import { KeysService } from '../../keys';
import { MessagesEvent } from 'src/interfaces';
import { HydratedDocument, Types } from 'mongoose';
import { Article } from '../schemas';
import { Pagination } from '../../pagination';
import { ArticleBuilder } from './builders/article.builder';
import { ArticleVisitor } from './visitors';
import { Active } from '../types/classes';
import {
  DEFAULT_ERROR_ALL_KEYWORDS_REMOVED,
  DEFAULT_ERROR_ALL_REMOVE_KEYWORDS_NOT_FIND,
} from '../constants';
import { EventPostmanEnum } from 'src/modules/lib/events/types/enum';
import { PaginationUtils } from 'src/modules/utils/providers';

@Injectable({ scope: Scope.REQUEST })
export class ArticleService {
  protected readonly logger = new Logger(ArticleService.name);

  constructor(
    private readonly articleRepository: ArticleRepository,
    private readonly paginationUtils: PaginationUtils,
    private readonly keywordService: KeysService,
    private readonly articleVisitor: ArticleVisitor,
    private readonly articleBuilder: ArticleBuilder,
  ) { }

  async create(data: CreateArticleDto, user: User) {
    try {
      const { keys, article } = data;
      const findArticle = await this.articleRepository.findOne({ userId: user, article });

      if (keys.length === 0 && !findArticle) {
        const builder = this.articleBuilder.create(keys.length, user, article).initPagination();

        const document = builder.document;

        builder
          .getProductAndUpdate(article)

        builder.activateSendPostman(3, user);

        return { event: MessagesEvent.CREATE_ARTICLE, article: document }

      }

      if (findArticle) {
        const document = await this.articleRepository.findOneAndUpdate(
          { _id: findArticle._id },
          { $set: { active: true } },
        );
        return this.addKeywords({ articleId: document._id, keys }, user);
      } else {
        const builder = this.articleBuilder.create(keys.length, user, article).initPagination();

        const document = builder.document;

        builder
          .getProductAndUpdate(article)
          .getCities(user)
          .metricsCreate()
          .keywordCreate(keys, user, article);

        builder.activateSendPostman(keys.length, user);

        return { event: MessagesEvent.CREATE_ARTICLE, article: document };
      }
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  async addKeywords(data: AddKeyDto, user: User) {
    const { articleId, keys } = data;
    const article: HydratedDocument<Article> = await this.articleRepository.findOne({
      _id: articleId,
    });

    if (article) {
      const comparisonCheck = await this.keywordService.inspectKeywords(
        user,
        keys,
        article.article,
      );
      const [newKeyword, oldKeyword] = comparisonCheck;
      const count = newKeyword.length + oldKeyword.length;
      const builder = this.articleBuilder;

      builder
        .setDocument(article)
        .getCities(user)
        .keywordCreate(newKeyword, user, article.article)
        .countUp(count);

      this.articleVisitor.setDocument(article).activeKeywords(oldKeyword, { active: true });

      count > 0 ? builder.activateSendPostman(count, user) : null;

      return {
        event: MessagesEvent.ADD_KEYWORDS,
        newKeywords: newKeyword.length,
        oldKeywords: oldKeyword.length,
        article: article.article,
      };
    } else {
      throw new BadRequestException(`Артикул не был найден, некорректные параметры запроса`);
    }
  }

  async findArticle(_id: Types.ObjectId, query) {
    const data = await this.articleRepository.findArticle({ _id: _id }, query);
    console.log(data.keys.length)
    const pagination = data.pagination as unknown as HydratedDocument<Pagination>;
    const { keys, count, meta } = await this.paginationUtils.paginate(
      { limit: pagination.key_limit, page: pagination.page },
      data.keys,
      'keys',
    );

    return {
      article: {
        ...data,
        keys,
      },
      meta,
      total_keys: count,
    };
  }

  async articles(id: User, query) {
    const list = await this.articleRepository.findList(id, query.search, query.sort);
    return {
      articles: [...list.NullKeywordArray, ...list.articles],
      count_keys: list.articles.reduce((accumulator, currentValue) => {
        return (accumulator += currentValue.count);
      }, 0),
    };
  }

  async removeArticle(data: RemoveArticleDto, user: User) {
    const articles = data.articleId;

    const response: Promise<HydratedDocument<Article>>[] = [];

    while (articles.length > 0) {
      const article = articles.shift();
      const document = await this.articleRepository.findOne({
        _id: article,
        userId: user,
        active: true,
      });

      const update = this.articleVisitor.setDocument(document).switchArticle(new Active(false));

      response.push(update);
    }

    return Promise.all(
      response.map(element =>
        element
          .catch(error => {
            throw error;
          })
          .then(document => document.article),
      ),
    );
  }

  async removeKeywords(data: RemoveKeyDto, user: User) {
    const article = await this.articleRepository.findOne({ _id: data.articleId, userId: user });

    if (article.keys.length === data.keysId.length) {
      throw new BadRequestException(DEFAULT_ERROR_ALL_KEYWORDS_REMOVED);
    } else {
      const getKeywords = await this.keywordService.find({
        _id: data.keysId,
        userId: user,
        active: true,
      });

      if (getKeywords.length === 0)
        throw new BadRequestException(DEFAULT_ERROR_ALL_REMOVE_KEYWORDS_NOT_FIND);

      this.articleVisitor.setDocument(article).disabledKeywords(getKeywords, new Active(false));

      this.articleVisitor.eventPostmanDispatcher.dispatch({
        count: data.keysId.length,
        user: user,
        type: EventPostmanEnum.CREATE_ARTICLE,
      });

      return {
        event: MessagesEvent.DELETE_KEY,
        length: data.keysId.length,
      };
    }
  }

  async refreshArticle(article: string, user: User) {
    return this.articleRepository
      .findOne({ _id: article, userId: user })
      .then(document => {
        if (!document) throw new BadRequestException(`Артикул не был найден`);
        this.articleBuilder
          .setDocument(document)
          .getProductAndUpdate(document.article)
          .updateArticle();
        return { event: MessagesEvent.REFRESH_ARTICLE, article: document.article };
      })
      .catch(error => {
        throw error;
      });
  }
}
