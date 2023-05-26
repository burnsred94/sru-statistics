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
    const articleCreate = await this.modelArticle.create(newArticle);
    return await articleCreate.save();
  }

  async findOne(data: Partial<Article>) {
    console.log(data);
    const find = await this.modelArticle
      .find(data)
      .populate({
        path: 'keys',
        populate: {
          path: 'pwz'
        }
      }).exec()

    console.log(find)
    return find;
  }
}
