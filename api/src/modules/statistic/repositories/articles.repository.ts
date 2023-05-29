import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Article } from '../schemas/article.schema';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ArticleEntity } from '../entity';
import { Keys } from '../schemas/keys.schema';
import { Pwz } from '../schemas/pwz.schema';
import { FindDataDto } from '../dto/find-data.dto';
import { NOT_FIND_ERROR } from 'src/constatnts/errors.constants';
import { filter, includes, map } from 'lodash';
import { RemoveKeyDto } from '../dto/remove-key.dto';

@Injectable()
export class ArticleRepository {
  constructor(
    @InjectModel(Article.name) private readonly modelArticle: Model<Article>,
  ) { }

  async create(article: Article): Promise<Article> {
    const newArticle = new ArticleEntity(article);
    const articleCreate = await this.modelArticle.create(newArticle);
    const save = await articleCreate.save();
    return save.populate({
      path: 'keys',
      model: Keys.name,
      select: 'pwz key',
      populate: { path: 'pwz', model: Pwz.name, select: 'name position' },
    });
  }

  async findByCityFromAddKeys(cityId: string) {
    return await this.modelArticle
      .findById({
        _id: cityId,
      })
      .populate({
        path: 'keys',
        model: Keys.name,
        select: 'pwz key',
        populate: { path: 'pwz', model: Pwz.name, select: 'name' },
      });
  }

  async findAll() {
    const find = await this.modelArticle
      .find()
      .populate({
        path: 'keys',
        model: Keys.name,
        select: 'pwz key',
        populate: {
          path: 'pwz',
          model: Pwz.name,
          select: 'name position',
          populate: {
            path: 'position',
            select: 'position timestamp difference',
          },
        },
      })
      .exec();
    return find;
  }

  async removeArticle(data) {
    const remove = await this.modelArticle.deleteOne({
      userId: data.userId,
      _id: data.cityId,
      article: data.article,
    });
    console.log(remove);
    if (remove.deletedCount !== 0) {
      return { message: 'Removed successfully' };
    }
  }

  async updateArticle(keyId: Types.ObjectId[], userId: string) {
    const find = await this.modelArticle.findById(userId);
    console.log(find);
    const findOrUpdate = await this.modelArticle.findByIdAndUpdate(
      {
        _id: userId,
      },
      {
        keys: [...find.keys, ...keyId],
      },
    );

    return findOrUpdate;
  }

  async removeKeyByArticle(data: RemoveKeyDto) {
    const find = await this.modelArticle.findOne({
      _id: data.cityId,
      userId: data.userId,
      article: data.article,
    });

    if (find) {
      const remove = await this.modelArticle.findByIdAndUpdate(
        {
          _id: find._id,
        },
        {
          keys: find.keys.filter(object => !object.equals(data.keyId)),
        },
      );
      return remove.populate({
        path: 'keys',
        model: Keys.name,
        select: 'pwz key',
        populate: {
          path: 'pwz',
          model: Pwz.name,
          select: 'name position',
          populate: {
            path: 'position',
            select: 'position timestamp difference',
          },
        },
      });
    } else throw new BadRequestException(NOT_FIND_ERROR);
  }

  async findByCity(data: FindDataDto) {
    const find = await this.modelArticle
      .find({
        city_id: data.city,
        userId: data.userId,
      })
      .populate({
        path: 'keys',
        model: Keys.name,
        select: 'pwz key',
        populate: {
          path: 'pwz',
          model: Pwz.name,
          select: 'name position',
          populate: {
            path: 'position',
            select: 'position timestamp difference',
          },
        },
      });
    if (find.length === 0) throw new BadRequestException(NOT_FIND_ERROR);

    return await this.filterByTimestamp(find, data.periods);
  }

  async filterByTimestamp(data, period) {
    const result = map(data, value => {
      return {
        _id: value._id,
        productName: value.productName,
        article: value.article,
        city: value.city,
        userId: value.userId,
        city_id: value.city_id,
        keys: map(value.keys, key => ({
          _id: key._id,
          key: key.key,
          pwz: map(key.pwz, pwz => ({
            _id: pwz._id,
            name: pwz.name,
            position: pwz.position.filter(object =>
              period.includes(object.timestamp),
            ),
          })),
        })),
      };
    });

    return result;
  }
}
