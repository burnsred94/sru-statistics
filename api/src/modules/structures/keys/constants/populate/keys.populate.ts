import { PopulateOptions } from 'mongoose';
import { Periods } from 'src/modules/structures/periods';
import { Pvz } from 'src/modules/structures/pvz';

export const KeysRefreshPopulate: PopulateOptions | (string | PopulateOptions)[] = [
  {
    path: 'pwz',
    select: 'position name geo_address_id',
    model: Pvz.name,
    populate: { path: 'position', select: 'position cpm promo_position', model: Periods.name },
  },
];
