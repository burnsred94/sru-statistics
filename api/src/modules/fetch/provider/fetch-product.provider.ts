import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GotService } from '@t00nday/nestjs-got';

@Injectable()
export class FetchProductProvider {
  constructor(
    private readonly gotService: GotService,
    private readonly configService: ConfigService,
  ) {}

  async fetchArticleName(article) {
    const url = await this.configService.get('PRODUCT_SERVICE_GET_ARTICLE');
    const data = await this.gotService.gotRef(url + article);
    return JSON.parse(data.body);
  }
}
