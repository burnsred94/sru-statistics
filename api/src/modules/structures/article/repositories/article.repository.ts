import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Article, ArticleDocument } from '../schemas/article.schema';
import { Injectable } from '@nestjs/common';
import { ArticleEntity } from '../entities';
import { User } from 'src/modules/auth';
import { FindByCityDto, FindByCityQueryDto, RemoveArticleDto } from '../dto';
import { Keys, KeysService } from '../../keys';
import { chunk, compact, map, uniqBy } from 'lodash';
import { Pvz } from '../../pvz';
import { OnEvent } from '@nestjs/event-emitter';
import { Average } from '../../average';
import { Periods } from '../../periods';
import { Pagination } from '../../pagination';

@Injectable()
export class ArticleRepository {
  constructor(
    @InjectModel(Article.name) private readonly modelArticle: Model<Article>,
    private readonly keysService: KeysService,
  ) { }

  //Забирает все артикулы и кол-во ключей
  async findByUser(user: User) {
    return await this.modelArticle.aggregate([
      { $match: { userId: user, active: true } },
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
        $group: {
          _id: '$_id',
          article: { $first: '$article' },
          userId: { $first: '$userId' },
          productName: { $first: '$productName' },
          productImg: { $first: '$productImg' },
          createdAt: { $first: '$createdAt' },
          keys_size: { $sum: 1 },
        },
      }
    ]);
  }

  async findOne(searchQuery: FilterQuery<ArticleDocument>) {
    return await this.modelArticle.findOne(searchQuery);
  }

  //Забирает один артикул
  async findArticle(searchQuery: FilterQuery<ArticleDocument>, query) {
    let search = {};

    if (query.search !== "") search = { key: { $regex: query.search, $options: 'i' } };

    let data = await this.modelArticle.findOne(searchQuery);

    const keys_length = data.keys.length;

    data = await data
      .populate({
        path: "keys",
        select: 'key average frequency active',
        match: { active: true, ...search },
        model: Keys.name,
        populate: [
          {
            path: 'average',
            select: 'timestamp average start_position cpm difference',
            match: { timestamp: { $in: query.period } },
            model: Average.name,
          },
          {
            path: 'pagination',
            select: 'page key_limit',
            model: Pagination.name,
            strictPopulate: false,
          },
          {
            path: 'pwz',
            select: 'name position',
            match: { active: true },
            model: Pvz.name,
            populate: {
              path: 'position',
              select: 'position timestamp difference promo_position cpm',
              match: { timestamp: { $in: query.period } },
              model: Periods.name,
            }
          }
        ]
      })


    return { article: data, keys_length }
  }

  //Нужно
  async findDataByUser(user: User) {
    const find = await this.modelArticle.countDocuments({ userId: user, active: true });
    const keysLength = await this.keysService.countUserKeys(user, true);
    return { total: find, total_keys: keysLength };
  }

  //Нужно
  async findProductKeys(
    article: string,
    userId: User,
    productActive: boolean,
    stateKeys?: boolean,
  ) {
    let product = await this.modelArticle.findOne({
      article: article,
      userId: userId,
      active: productActive,
    });

    if (product !== null) {
      if (stateKeys !== undefined) {
        product = await product.populate({
          path: 'keys',
          select: 'key active',
          match: { active: stateKeys },
          model: Keys.name,
        });
        return { keys: product.keys, _id: product._id };
      }

      product = await product.populate({ path: 'keys', select: 'key active', model: Keys.name });
      return { keys: product.keys, _id: product._id };
    }

    return null;
  }

  //Нужно
  async create(article: Article) {
    const newArticle = new ArticleEntity(article);
    const articleCreate = await this.modelArticle.create(newArticle);
    const save = await articleCreate.save();
    return save;
  }

  @OnEvent('keys.update')
  async update(payload: { id: Types.ObjectId; key: Types.ObjectId }) {
    await this.modelArticle.findByIdAndUpdate(payload.id, {
      $push: {
        keys: payload.key,
      },
    });
  }

  //Нужно
  async findByCity(data: FindByCityDto, id: number, query: FindByCityQueryDto[]) {
    const find = await this.modelArticle
      .find({
        userId: id,
        active: true,
      })
      .populate({
        path: 'keys',
        select: 'active ',
        match: { active: true },
        model: Keys.name,
      })
      .lean();

    const generateData = map(find, async stats => {
      const { keys, _id } = stats;
      const genKeys = await this.keysService.findByMany(
        { article: stats.article, userId: stats.userId, active: true },
        data.city,
      );

      const value = query?.find(pagination => pagination.articleId === String(_id));

      if (value === undefined) {
        const chunks = chunk(genKeys, 10);
        return {
          ...stats,
          keys: chunks[0],
          keys_length: keys.length,
          meta: {
            page: 1,
            total: chunks.length,
            page_size: 10,
          },
        };
      }

      if (value.articleId === String(_id)) {
        const chunks = chunk(genKeys, value.limit);
        return {
          ...stats,
          keys: chunks[value.page - 1],
          keys_length: keys.length,
          meta: {
            page: value.page,
            total: chunks.length,
            page_size: value.limit,
          },
        };
      }
    });

    const resolved = await Promise.all(generateData);
    const result = resolved.flat();
    return uniqBy(result, '_id');
  }

  async findById(articleId: string) {
    const find = await this.modelArticle.findById(articleId);
    return find.populate({
      path: 'keys',
      select: 'pwz key userId',
      model: Keys.name,
      populate: { path: 'pwz', select: 'name', model: Pvz.name },
    });
  }

  async backOldArticle(articleId: Types.ObjectId, id: User) {
    return await this.modelArticle.findOneAndUpdate(
      { _id: articleId, userId: id },
      { active: true },
    );
  }

  async removeArticle(articleId: string, id: User) {
    return await this.modelArticle.findOneAndUpdate(
      {
        _id: articleId,
        userId: id,
      },
      {
        active: false,
      },
    );
  }
}
