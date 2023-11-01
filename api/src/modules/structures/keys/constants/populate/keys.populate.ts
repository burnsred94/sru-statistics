import { PopulateOptions } from 'mongoose';
import { Average } from 'src/modules/structures/average';
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

export const KEYWORDS_METRIC_UPDATE: PopulateOptions | (string | PopulateOptions)[] = [
  {
    path: 'average',
    select: 'average start_position timestamp difference cpm',
    model: Average.name,
  },
  {
    path: 'pwz',
    select: 'city position name',
    model: Pvz.name,
    populate: {
      path: 'position',
      select: 'position cpm promo_position timestamp difference',
      model: Periods.name,
    },
  },
]
