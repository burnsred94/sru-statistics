import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Article } from '../schemas/article.schema';
import { Injectable } from '@nestjs/common';
import { ArticleEntity } from '../entities';
import { User } from 'src/modules/auth';
import { FindByCityDto, FindByCityQueryDto, RemoveArticleDto } from '../dto';
import { Keys, KeysService } from 'src/modules/keys';
import { chunk, map } from 'lodash';
import { Pvz } from 'src/modules/pvz';

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

  async update(data: Types.ObjectId[], id: Types.ObjectId) {
    await this.modelArticle.findByIdAndUpdate(id, {
      $push: {
        keys: data,
      },
    });
  }

  async findByCity(data: FindByCityDto, id: number, query: FindByCityQueryDto) {
    const find = await this.modelArticle
      .find({
        userId: id,
        active: true,
      })
      .populate({
        path: 'keys',
        select: 'active',
        match: { active: true },
        model: Keys.name,
      })
      .lean();

    const generateData = map(find, async stats => {
      const { keys, _id } = stats;
      const genKeys = await this.keysService.findById(
        keys as unknown as Array<{ _id: Types.ObjectId; active: boolean }>,
        data.periods,
        data.city,
      );

      const chunks = chunk(genKeys, query.limit);

      return query.articleId === String(_id)
        ? {
            ...stats,
            keys: chunks[query.page - 1],
            meta: {
              count: query.page,
              pages_count: chunks.length,
              total_keys: genKeys.length,
            },
          }
        : {
            ...stats,
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

  async removeArticle(data: RemoveArticleDto, id: User) {
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
}
