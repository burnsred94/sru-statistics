import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Article } from '../schemas/article.schema';
import { Injectable } from '@nestjs/common';
import { ArticleEntity } from '../entities';
import { User } from 'src/modules/auth';
import {
  FindByCityDto,
  FindByCityQueryDto,
  RemoveKeyDto,
  UpdateStatusDto,
} from '../dto';
import { Keys, KeysService } from 'src/modules/keys';
import { chunk, forEach, map, take } from 'lodash';
import { Pvz } from 'src/modules/pvz';
import { Periods } from 'src/modules/periods';

@Injectable()
export class ArticleRepository {
  constructor(
    @InjectModel(Article.name) private readonly modelArticle: Model<Article>,
    private readonly keysService: KeysService,
  ) { }

  async findUserData(data, user: number, query: FindByCityQueryDto) {
    const find = await this.modelArticle.find({
      userId: user,
    });
    return find;
  }



  async create(article: Article) {
    const newArticle = new ArticleEntity(article);
    const articleCreate = await this.modelArticle.create(newArticle);
    const save = await articleCreate.save();
    return save;
  }

  async update(data: Types.ObjectId, id: Types.ObjectId) {
    await this.modelArticle.findByIdAndUpdate(id, {
      $push: {
        keys: data,
      },
    });
  }


  async findByUser(user: number) {
    return await this.modelArticle
      .find({
        userId: user,
        active: true,
      })
      .populate({
        path: 'keys',
        select: 'key pwz',
        model: Keys.name,
        populate: {
          path: 'pwz',
          select: 'name',
          model: Pvz.name,
          populate: {
            path: 'position',
            select: 'timestamp position',
            model: Periods.name,
          },
        },
      });
  }

  async findByCity(data: FindByCityDto, id: number, query: FindByCityQueryDto) {
    const find = await this.modelArticle.find({
      userId: id,
      city_id: data.city,
      active: true,
    });
    const generateData = map(find, async stats => {
      const {
        keys,
        city_id,
        city,
        userId,
        productName,
        article,
        _id,
        productImg,
        productRef,
      } = stats;
      const genKeys = await this.keysService.findById(keys, data.periods);

      const chunks = chunk(genKeys, query.limit);

      return query.articleId === String(_id)
        ? {
          _id: _id,
          article: article,
          productName: productName,
          productImg: productImg,
          productRef: productRef,
          userId: userId,
          city: city,
          city_id: city_id,
          keys: chunks[query.page - 1],
          meta: {
            count: query.page,
            pages_count: chunks.length,
            total_keys: genKeys.length,
          },
        }
        : {
          _id: _id,
          article: article,
          productName: productName,
          productImg: productImg,
          productRef: productRef,
          userId: userId,
          city: city,
          city_id: city_id,
          keys: chunks[0],
          meta: {
            count: 1,
            pages_count: chunks.length,
            total_keys: genKeys.length,
          },
        };
    });

    const resolved = await Promise.all(generateData);
    return resolved;
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

  async updateStatus(data: UpdateStatusDto, id: User) {
    return await this.modelArticle.findOneAndUpdate(
      {
        _id: data.articleId,
        userId: id,
      },
      {
        active: false,
      },
    );
  }

  async removeKey(data: RemoveKeyDto, id: User) {
    const find = await this.modelArticle.findById(data.articleId).populate({ path: 'keys', select: 'key', model: Keys.name })

    const keyName = find.keys.find(key => String(key._id) === String(data.keyId))
    const findAll = await this.modelArticle.find({ userId: id, article: find.article }).populate({ path: 'keys', select: 'key', model: Keys.name })

    const dataUp = map(findAll, async value => {
      await this.modelArticle.findOneAndUpdate(
        {
          _id: value._id,
          userId: id,
        },
        {
          //@ts-ignore
          keys: value.keys.filter(key => key.key !== keyName.key),
        },
      );
      return 'success';
    })

    const resolved = await Promise.all(dataUp)

    return resolved
  }

  async find() {
    const find = await this.modelArticle
      .find({ active: true })
      .populate({
        path: 'keys',
        select: 'pwz key userId',
        model: Keys.name,
        populate: {
          path: 'pwz',
          select: 'name',
          model: Pvz.name,
          populate: {
            path: 'position',
            select: 'position',
            model: Periods.name,
          },
        },
      })
      .lean();
    return find;
  }
}