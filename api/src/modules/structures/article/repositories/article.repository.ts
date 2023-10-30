import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Article, ArticleDocument } from '../schemas/article.schema';
import { Injectable, Logger } from '@nestjs/common';
import { User } from 'src/modules/auth';
import { Keys } from '../../keys';
import { Pvz } from '../../pvz';
import { Average } from '../../average';
import { Periods } from '../../periods';
import { Pagination } from '../../pagination';
import { AbstractRepository } from 'src/modules/database';

export enum MetricsEnum {
  NEUTRAL = 'blue',
  UP = 'green',
  DOWN = 'red',
}

@Injectable()
export class ArticleRepository extends AbstractRepository<ArticleDocument> {
  protected readonly logger = new Logger(ArticleRepository.name);

  constructor(@InjectModel(Article.name) private modelArticle: Model<ArticleDocument>) {
    super(modelArticle);
  }

  //Забирает все артикулы и кол-во ключей c метрикой для артикула + есть сортировка и поиск
  async findList(user: User, search: string, sort_parameters: string) {
    let query = {};
    let sort = {};

    if (search !== undefined) query = { article: { $regex: search, $options: 'i' } };

    sort = sort_parameters
      ? (() => {
          const elements = sort_parameters.split('#');
          return {
            [elements[0]]: Number(elements[1]),
          };
        })()
      : { createdAt: -1 };

    return await this.modelArticle
      .aggregate([
        { $match: { userId: user, active: true, ...query } },
        {
          $lookup: {
            from: 'keys',
            localField: 'keys',
            foreignField: '_id',
            as: 'keys',
          },
        },
        { $unwind: '$keys' },
        {
          $match: { 'keys.active': true },
        },
        {
          $lookup: {
            from: 'metrics',
            localField: '_id',
            foreignField: 'article',
            as: 'metrics',
          },
        },
        { $unwind: '$metrics' },
        {
          $group: {
            _id: '$_id',
            article: { $first: '$article' },
            userId: { $first: '$userId' },
            count: { $first: '$count' },
            productName: { $first: '$productName' },
            metrics: { $first: '$metrics' },
            productImg: { $first: '$productImg' },
            createdAt: { $first: '$createdAt' },
            keys: { $push: '$keys' },
          },
        },
        {
          $project: {
            _id: 1,
            article: 1,
            userId: 1,
            count: 1,
            productName: 1,
            productImg: 1,
            createdAt: 1,
            middle_pos_organic: {
              num: { $arrayElemAt: ['$metrics.middle_pos_organic.met', -1] },
              data: { $slice: ['$metrics.middle_pos_organic', -15] },
              color_metrics: {
                $cond: {
                  if: {
                    $eq: [
                      { $arrayElemAt: ['$metrics.middle_pos_organic.met', 0] },
                      { $arrayElemAt: ['$metrics.middle_pos_organic.met', -1] },
                    ],
                  },
                  then: MetricsEnum.NEUTRAL,
                  else: {
                    $cond: {
                      if: {
                        $gt: [
                          { $arrayElemAt: ['$metrics.middle_pos_organic.met', 0] },
                          { $arrayElemAt: ['$metrics.middle_pos_organic.met', -1] },
                        ],
                      },
                      then: MetricsEnum.DOWN,
                      else: MetricsEnum.UP,
                    },
                  },
                },
              },
            },
            middle_pos_adverts: {
              num: { $arrayElemAt: ['$metrics.middle_pos_adverts.met', -1] },
              data: { $slice: ['$metrics.middle_pos_adverts', -15] },
              color_metrics: {
                $cond: {
                  if: {
                    $eq: [
                      { $arrayElemAt: ['$metrics.middle_pos_adverts.met', 0] },
                      { $arrayElemAt: ['$metrics.middle_pos_adverts.met', -1] },
                    ],
                  },
                  then: MetricsEnum.NEUTRAL,
                  else: {
                    $cond: {
                      if: {
                        $gt: [
                          { $arrayElemAt: ['$metrics.middle_pos_adverts.met', 0] },
                          { $arrayElemAt: ['$metrics.middle_pos_adverts.met', -1] },
                        ],
                      },
                      then: MetricsEnum.UP,
                      else: MetricsEnum.DOWN,
                    },
                  },
                },
              },
            },
            trend: { $slice: ['$metrics.indexes', -15] },
          },
        },
        {
          $sort: sort,
        },
      ])
      .exec()
      .then(value => ({ articles: value }));
  }

  //Забирает один артикул
  async findArticle(
    searchQuery: FilterQuery<ArticleDocument>,
    query: { sort: string; search: string; period: string[]; city: string },
  ) {
    let search = {};
    let sort = { frequency: 1 }; // default
    let city = {};

    if (query.search !== undefined) search = { key: { $regex: query.search, $options: 'i' } };

    if (query.sort !== undefined) sort = { frequency: Number(query.sort) };

    if (query.city !== undefined) city = { city: query.city };

    let data = this.modelArticle.findOne(searchQuery);

    data = data.populate([
      {
        path: 'keys',
        select: 'key average frequency active',
        match: { active: true, ...search },
        options: {
          sort: sort,
        },
        model: Keys.name,
        populate: [
          {
            path: 'average',
            select: 'timestamp average start_position cpm difference',
            match: { timestamp: { $in: query.period } },
            model: Average.name,
          },
          {
            path: 'pwz',
            select: 'name position',
            match: { ...city },
            model: Pvz.name,
            populate: {
              path: 'position',
              select: 'position timestamp difference promo_position cpm',
              match: { timestamp: { $in: query.period } },
              model: Periods.name,
            },
          },
        ],
      },
      {
        path: 'pagination',
        select: 'page key_limit',
        model: Pagination.name,
      },
    ]);

    return await data.lean();
  }
}
