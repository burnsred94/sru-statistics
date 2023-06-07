import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GotService } from '@t00nday/nestjs-got';
import axios from 'axios';
import { map } from 'lodash';
import { Types } from 'mongoose';
import { User } from 'src/modules/auth/user';
import { Pwz } from 'src/modules/interfaces';
import {
  IPwz,
  ITown,
} from 'src/modules/interfaces/requested/create-requested.interface';

@Injectable()
export class FetchProvider {
  constructor(
    private readonly gotService: GotService,
    private readonly configService: ConfigService,
  ) { }

  async fetchSearch(pvz: IPwz[], article: string, key: string) {
    const url = await this.configService.get('SEARCH_API_URL');
    const { data } = await axios.post(url, {
      article: article,
      pvz: pvz,
      key: key,
    });
    console.log(data, url);
  }

  async fetchSearchKey(
    value: { name: string },
    article: string,
    keys: string[],
  ) {
    const url = await this.configService.get('SEARCH_API_URL');
  }

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
