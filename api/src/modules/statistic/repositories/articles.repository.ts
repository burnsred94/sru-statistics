import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Article } from '../schemas/article.schema';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ArticleEntity, PeriodsEntity } from '../entity';
import { Keys } from '../schemas/keys.schema';
import { Pwz } from '../schemas/pwz.schema';
import { FindDataDto } from '../dto/find-data.dto';
import {
  NOT_FIND_ERROR,
  ONE_KEY_NOT_REMOVED,
} from 'src/constatnts/errors.constants';
import { map } from 'lodash';
import { RemoveKeyDto } from '../dto/remove-key.dto';
import { randomUUID } from 'node:crypto';
import { GetOneDto } from '../dto/get-one-article.dto';
import { User } from 'src/modules/auth/user';
import { AddKeysDto, RemoveArticleDto } from '../dto';

@Injectable()
export class ArticleRepository {
  constructor(
    @InjectModel(Article.name) private readonly modelArticle: Model<Article>,
  ) {}

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

  async findByCityFromAddKeys(data: AddKeysDto, user: User) {
    return await this.modelArticle
      .findOne({
        city_id: data.cityId,
        userId: user,
        article: data.article,
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

  async findOneArticle(data: GetOneDto, check: boolean) {
    const find = await this.modelArticle
      .findOne({
        city_id: data.cityId,
        userId: data.userId,
        article: data.article,
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

    if (check) return find;

    return await this.filterByTimestamp([find], data.periods);
  }

  async removeArticle(data: RemoveArticleDto, user: User) {
    const remove = await this.modelArticle.deleteOne({
      userId: user,
      city_id: data.cityId,
      article: data.article,
    });
    if (remove.deletedCount !== 0) {
      return { message: 'Removed successfully' };
    }
  }

  async updateArticle(keyId: Types.ObjectId[], userId: Types.ObjectId) {
    const find = await this.modelArticle.findById({ _id: userId });
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

  async removeKeyByArticle(data: RemoveKeyDto, user: User) {
    const find = await this.modelArticle.findOne({
      city_id: data.cityId,
      userId: user,
      article: data.article,
    });

    if (find) {
      if (find.keys.length === 1)
        throw new BadRequestException(ONE_KEY_NOT_REMOVED);
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

  async findByCity(data: FindDataDto, user: User) {
    const find = await this.modelArticle
      .find({
        city_id: data.city,
        userId: user,
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

  async finCityArticle(article: string, user: User, cityId: string) {
    return await this.modelArticle.findOne({
      article: article,
      userId: user,
      city_id: cityId,
    });
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
          average: Object.entries(
            map(key.pwz, pwz => {
              const averageArray = pwz.position.reduce(
                (accumulator, object) => {
                  const number = +object.position;
                  if (!Number.isNaN(number))
                    accumulator.push({
                      timestamp: object.timestamp,
                      average: number,
                    });
                  return accumulator;
                },
                [],
              );
              return averageArray;
            })
              .flat()
              .reduce((accumulator, current) => {
                const { timestamp, average } = current;
                if (!accumulator[timestamp]) {
                  accumulator[timestamp] = [];
                }
                accumulator[timestamp].push(average);
                return accumulator;
              }, {}),
          ).map(([timestamp, averages]) => ({
            _id: randomUUID(),
            timestamp,
            average:
              //@ts-ignore
              averages.reduce(
                (accumulator, current) => accumulator + current,
                0,
                //@ts-ignore
              ) / averages.length,
          })),
          pwz: map(key.pwz, pwz => ({
            _id: pwz._id,
            name: pwz.name,
            position: period.reduce((accumulator, string) => {
              const findObject = pwz.position.find(p => p.timestamp === string);
              if (findObject) {
                accumulator.push(findObject);
              } else {
                const newPeriod = new PeriodsEntity(
                  'Не обнаружено среди 2100 позиций',
                ).mockPeriod(string);
                accumulator.push(newPeriod);
              }
              return accumulator;
            }, []),
          })),
        })),
      };
    });
    return result.reverse();
  }
}
