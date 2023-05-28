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

  async findOne(id: string) {
    const find = await this.modelArticle
      .findById({
        _id: id,
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
        _id: data.city,
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

    const result = await this.modelArticle.aggregate([
      {
        $match: {
          _id: { $in: find.map(p => p._id) },
        },
      },
      {
        $unwind: {
          path: '$keys',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'keys',
          localField: 'keys',
          foreignField: '_id',
          as: 'keys',
        },
      },
      {
        $unwind: {
          path: '$keys.pwz',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'pwzs',
          localField: 'keys.pwz',
          foreignField: '_id',
          as: 'pwz',
        },
      },
      {
        $unwind: {
          path: '$pwz.position',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'periods',
          localField: 'pwz.position',
          foreignField: '_id',
          as: 'position',
        },
      },

      // {
      //   $unwind: {
      //     path: '$pwzs.periods',
      //     preserveNullAndEmptyArrays: true,
      //   },
      // },
      // {
      //   $lookup: {
      //     from: 'periods',
      //     localField: 'position.position',
      //     foreignField: 'position.position',
      //     as: 'position',
      //   },
      // },
    ]);

    return find;
  }
}
// return result;
// {
//   $project: {
//     'keys.pwz.position': {
//       $filter: {
//         input: '$keys.pwz.position',
//         as: 'pos',
//         cond: {
//           $in: ['$$pos.timestamp', dates],
//         },
//       },
//     },
//   },
// },
