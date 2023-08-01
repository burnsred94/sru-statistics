import { Injectable } from '@nestjs/common';
import { map } from 'lodash';
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
}
