import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Article } from '../schemas/article.schema';
import { Injectable } from '@nestjs/common';
import { ArticleEntity } from '../entity';
import { Keys } from '../schemas/keys.schema';
import { Pwz } from '../schemas/pwz.schema';

@Injectable()
export class ArticleRepository {
  constructor(
    @InjectModel(Article.name) private readonly modelArticle: Model<Article>,
  ) { }

  async create(article: Article): Promise<Article> {
    const newArticle = new ArticleEntity(article);
    const articleCreate = await this.modelArticle.create(newArticle)
    const save = await articleCreate.save();
    return save.populate({ path: 'keys', model: Keys.name, select: 'pwz', populate: { path: 'pwz', model: Pwz.name, select: 'name position' } })
  }

  async findOne(data: Partial<Article>) {
    const find = await this.modelArticle
      .findOne({
        email: data.email,
        telegramId: data.telegramId,
        article: data.article
      })
      .populate({ path: 'keys', model: Keys.name, select: 'pwz', populate: { path: 'pwz', model: Pwz.name, select: 'name position' } })
      .exec()
    console.log(find)
    return find;
  }
}
