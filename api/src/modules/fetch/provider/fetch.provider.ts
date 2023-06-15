import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GotService } from '@t00nday/nestjs-got';
import { User } from 'src/modules/auth/user';

@Injectable()
export class FetchProvider {
  constructor(
    private readonly gotService: GotService,
    private readonly configService: ConfigService,
  ) {}

  async fetchArticleName(article) {
    const url = await this.configService.get('PRODUCT_SERVICE_GET_ARTICLE');
    const data = await this.gotService.gotRef(url + article);
    return JSON.parse(data.body);
  }

  async fetchProfile(id: User) {
    const url = await this.configService.get('PROFILE_API_URL');
    const { body } = await this.gotService.gotRef(url + id);
    const parse = JSON.parse(body);
    return parse.data.product_name;
  }
}
