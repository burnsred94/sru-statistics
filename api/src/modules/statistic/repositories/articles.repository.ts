import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Article } from '../schemas/article.schema';
import { Injectable } from '@nestjs/common';
import { ArticleEntity } from '../entity';
import { Keys } from '../schemas/keys.schema';

@Injectable()
export class ArticleRepository {
  constructor(
    @InjectModel(Article.name) private readonly modelArticle: Model<Article>,
  ) { }

  async create(article: Article): Promise<Article> {
    const newArticle = new ArticleEntity(article);
    const articleCreate = await this.modelArticle.create(newArticle);
    return await articleCreate.save()

  }

  async findOne(data: Partial<Article>) {
    const find = await this.modelArticle
      .find({
        email: data.email,
        telegramId: data.telegramId,
        article: data.article,
      })
      .populate('keys', null, Keys.name);

    return find;
  }
}
