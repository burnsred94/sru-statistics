import { Injectable, Logger, Scope } from '@nestjs/common';
import { HydratedDocument, Types } from 'mongoose';
import { User } from 'src/modules/auth';
import { ProductsIntegrationService } from 'src/modules/integrations/products/services';
import { ProfilesIntegrationService } from 'src/modules/integrations/profiles/services';
import { IAdaptiveProfile } from 'src/modules/integrations/profiles/types';
import { KeyBuilder, Keys } from 'src/modules/structures/keys';
import { Article } from '../../schemas';
import { ArticleRepository } from '../../repositories';
import { PaginationService } from 'src/modules/structures/pagination';
import { concatMap, from } from 'rxjs';
import { IAddressSendData } from 'src/modules/structures/keys/types';
import { EventPostmanDispatcher } from 'src/modules/lib/events/event-postman.dispatcher';
import { AbstractArticleService } from '../article-service.abstract';
import { MetricsService } from 'src/modules/structures/metrics/services';

export interface IPreparationKey {
  address: Promise<Types.ObjectId[]>;
  average: Promise<Types.ObjectId>;
  frequency: number;
  pwz: Promise<IAddressSendData>[];
}

@Injectable({ scope: Scope.REQUEST })
export class ArticleBuilder extends AbstractArticleService {
  protected readonly logger = new Logger(ArticleBuilder.name);

  document: Promise<HydratedDocument<Article>>;
  private cities: Promise<IAdaptiveProfile[]>;

  constructor(
    readonly eventPostmanDispatcher: EventPostmanDispatcher,
    private readonly profileIntegration: ProfilesIntegrationService,
    private readonly paginationService: PaginationService,
    private readonly metricsService: MetricsService,
    private readonly articleRepository: ArticleRepository,
    private readonly productIntegration: ProductsIntegrationService,
    private readonly keyBuilder: KeyBuilder,
  ) {
    super(eventPostmanDispatcher);
  }

  create(count: number, user: User, article: string) {
    this.document = new Promise(resolve => {
      const document = this.articleRepository
        .create({
          article: article,
          userId: user,
          productName: 'Поиск названия артикула...',
          productRef: '#',
          productImg: '',
          count,
        })
        .then(document => {
          this.logger.log(`Article created successfully ${article} from id: ${document._id}`);
          return document;
        })
        .catch(error => {
          this.logger.error({
            target: `Error target: ${this.create.name}`,
            error: `Error creating article: ${error.message}`,
          });
          throw error;
        });

      resolve(document);
    });
    return this;
  }

  keywordCreate(keywords: string[], user: User, article: string) {
    if (keywords.length === 0) return this;

    Promise.all([this.cities, this.document]).then(data => {
      const [cities, document] = data;

      const builder = this.keyBuilder;

      from(keywords)
        .pipe(
          concatMap(key => {
            const preparation: Promise<IPreparationKey> = builder
              .createAverage(user)
              .getFrequency(key)
              .createAddress(cities, article, user);

            builder.create(key, user, article, preparation);

            const document = builder.getDocument();

            return document;
          }),
        )
        .subscribe(data => {
          this.articleRepository.findOneAndUpdate(
            { _id: document._id },
            { $push: { keys: data._id } },
          );
        });
    });

    return this;
  }

  metricsCreate() {
    Promise.all([this.document, this.cities]).then(([document, cities]) => {
      this.metricsService.create({
        userId: document.userId,
        article: document._id,
        addresses: cities,
      });
    });
    return this;
  }

  getProductAndUpdate(article: string) {
    const product = this.productIntegration.getProduct(article);

    Promise.all([product, this.document]).then(data => {
      const [product, document] = data;
      console.log(product);
      this.articleRepository.findOneAndUpdate(
        { _id: document._id },
        {
          productName: product.product_name,
          productRef: product.product_url,
          productImg: product.img,
        },
      );
    });

    return this;
  }

  setDocument(document: HydratedDocument<Article>) {
    this.document = new Promise<HydratedDocument<Article>>(resolve => resolve(document));
    return this;
  }

  getCities(user: User) {
    const cities = this.profileIntegration.getTownsProfile(user).catch(error => {
      this.logger.error(error.message);
      throw error;
    });

    this.cities = cities;

    return this;
  }

  initPagination() {
    Promise.resolve(this.document)
      .then(async ({ _id }) => {
        const pagination = await this.paginationService.create({ article_id: _id });
        this.articleRepository.findOneAndUpdate({ _id }, { $set: { pagination: pagination._id } });
      })
      .catch(error => {
        this.logger.error({
          target: `${this.initPagination.name}`,
          message: `Error update/create pagination: ${error.message}`,
        });
      });

    return this;
  }

  countUp(count: number) {
    Promise.resolve(this.document).then(document => {
      this.articleRepository.findOneAndUpdate({ _id: document._id }, { $inc: { count: count } });
    });

    return this;
  }

  countDown(count: number) {
    Promise.resolve(this.document).then(document => {
      this.articleRepository.findOneAndUpdate({ _id: document._id }, { $inc: { count: -count } });
    });

    return this;
  }

  updateArticle() {
    Promise.resolve(this.document).then(document => {
      const { keys } = document;
      Promise.all(
        keys.map(async keyword => {

          const builder = this.keyBuilder;
          const document = (await builder.getDocument(keyword)) as HydratedDocument<Keys>;
          return builder
            .getFrequency(document.key)
            .initialUpdateData(document);
        }),
      );
      super.activateSendPostman(keys.length, document.userId)
    });
  }
}
