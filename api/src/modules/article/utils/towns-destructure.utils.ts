import { Injectable } from '@nestjs/common';
import { map, uniq } from 'lodash';
import { IProfileApiResponse } from 'src/interfaces';

@Injectable()
export class TownsDestructor {
  async destruct(data: IProfileApiResponse) {
    const { towns } = data;
    const addresses = map(towns, town => {
      return map(town.addresses, address => {
        return {
          addressId: address.addressId,
          address: address.address,
          city: town.city,
          city_id: town.city_id,
        };
      });
    });
    return addresses.flat();
  }

  async matchKeys(added: string[], current) {
    const result = added.filter((key: string) => {
      const find = current.find(element => element.key === key)
      if (!find) {
        return key
      }
    })
    return result
  }

  async matchKeysNotActive(added: string[], current) {
    const result = []
    added.filter((key: string) => {
      const find = current.find(element => element.key === key)
      if (find) {
        result.push(find._id)
      }
    });
    return uniq(result);
  }

  async keysFilter(keys: string[]) {
    return uniq(keys);
  }
}
