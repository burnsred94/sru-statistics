import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GotService } from '@t00nday/nestjs-got';
import { forEach, map } from 'lodash';
import { ITown } from 'src/modules/interfaces/requested/create-requested.interface';

@Injectable()
export class FetchProvider {
  constructor(
    private readonly gotService: GotService,
    private readonly configService: ConfigService,
  ) {}

  async fetchSearch(data: ITown, article: string, keys: string[]) {
    const url = await this.configService.get('SEARCH_API_URL');
    const result = map(data.pwz, async (address, index) => {
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
}
