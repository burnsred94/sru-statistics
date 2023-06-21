import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { map } from 'lodash';
import { IPwz } from 'src/modules/article';

@Injectable()
export class FetchSearchProvider {
  constructor(private readonly configService: ConfigService) {}

  async fetchSearch(pvz: IPwz[], article: string, key: string) {
    const url = await this.configService.get('SEARCH_API_URL');

    const { data } = await axios.post(url, {
      article: article,
      pvz: pvz,
      key: key,
    });

    return data;
  }

  async fetchUpdate(pvz, article: string, key: string) {
    const url = await this.configService.get('SEARCH_API_URL');

    const result = map(pvz, async v => {
      setTimeout(async () => {
        const { data } = await axios.post(url, {
          article: article,
          key: key,
          pvz: [{ name: v.name }],
        });
        const diff = Number(v.position) - data.data[0].position;

        return {
          name: data.data[0].address,
          id: v._id,
          differences:
            v.position.length > 4
              ? '0'
              : diff > 0
              ? String(`+${diff}`)
              : String(diff),
          position: data.data[0].position,
        };
      }, 150);
    });

    const resolved = await Promise.all(result);

    return resolved;
  }
}
