import { Injectable } from '@nestjs/common';
import { map } from 'lodash';

@Injectable()
export class FetchUtils {
  async formatDataToParse(data) {
    return map(data, item => {
      const { key, pwz, article } = item;
      const addresses = map(pwz, element => {
        return {
          name: element.name,
          addressId: element._id,
          periodId: element.position[0]._id,
        };
      });
      return {
        article: article,
        key: key,
        key_id: item._id,
        pvz: addresses,
      };
    });
  }
}