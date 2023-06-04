import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GotService } from '@t00nday/nestjs-got';
import { map } from 'lodash';
import { Types } from 'mongoose';
import { User } from 'src/modules/auth/user';
import { ITown } from 'src/modules/interfaces/requested/create-requested.interface';

@Injectable()
export class FetchProvider {
  constructor(
    private readonly gotService: GotService,
    private readonly configService: ConfigService,
  ) {}

  async fetchSearch(data: ITown, article: string, keys: string[]) {
    const url = await this.configService.get('SEARCH_API_URL');
    const result = map(data.pwz, async address => {
      const result = await this.gotService
        .gotRef(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'PostmanRuntime/7.32.2',
          },
          body: JSON.stringify({
            data: {
              article: article,
              keys: keys,
              address: address.name,
            },
          }),
        })
        .then(response => {
          const { data } = JSON.parse(response.body);
          if (data.result) {
            const parse = data.result.map(item => ({
              key: item.key,
              result: {
                _id: address._id,
                address: data.address,
                position: item.position,
              },
            }));
            return parse;
          }
        });
      return { city: data.city, _id: data._id, data: result };
    });
    return await Promise.all(result);
  }

  async fetchSearchKey(
    value: { _id: Types.ObjectId; name: string },
    article: string,
    keys: string[],
  ) {
    const url = await this.configService.get('SEARCH_API_URL');
    const result = await this.gotService
      .gotRef(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'PostmanRuntime/7.32.2',
        },
        body: JSON.stringify({
          data: {
            article: article,
            keys: keys,
            address: value.name,
          },
        }),
      })
      .then(response => {
        const { data } = JSON.parse(response.body);
        if (data.result) {
          const parse = data.result.map(item => ({
            key: item.key,
            result: {
              _id: value._id,
              address: value.name,
              position: item.position,
            },
          }));
          return parse;
        }
      });
    return { _id: value._id, data: result };
  }

  async fetchArticleName(article) {
    const url = await this.configService.get('PRODUCT_SERVICE_GET_ARTICLE');
    return await this.gotService.gotRef(url + article);
  }

  async fetchProfile(id: User) {
    console.log(id);
    const url = await this.configService.get('PROFILE_API_URL');
    const { body } = await this.gotService.gotRef(url + id);

    return JSON.parse(body);
  }
}
