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
import { map, take } from 'lodash';
import { Pvz } from 'src/modules/pvz';
import { Periods } from 'src/modules/periods';

@Injectable()
export class ArticleRepository {
  constructor(
    @InjectModel(Article.name) private readonly modelArticle: Model<Article>,
    private readonly keysService: KeysService,
  ) {}

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

  async findByCity(data: FindByCityDto, id: User, query: FindByCityQueryDto) {
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
            keys: take(genKeys, query.page * query.limit),
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
            keys: take(genKeys, 8),
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
    const find = await this.modelArticle.findById(data.articleId);

    return await this.modelArticle.findOneAndUpdate(
      {
        _id: data.articleId,
        userId: id,
      },
      {
        keys: find.keys.filter(key => String(key._id) !== String(data.keyId)),
      },
    );
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
