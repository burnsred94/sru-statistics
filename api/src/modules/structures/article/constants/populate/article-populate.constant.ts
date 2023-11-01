import { PopulateOptions } from 'mongoose';
import { Average } from 'src/modules/structures/average';
import { Keys } from 'src/modules/structures/keys';
import { Periods } from 'src/modules/structures/periods';
import { Pvz } from 'src/modules/structures/pvz';

export const ARTICLE_POPULATE: PopulateOptions | (string | PopulateOptions)[] = [
  {
    path: 'keys',
    select: 'key average frequency active pwz',
    match: { active: true, $or: [{ active_sub: true }, { active_sub: { $exists: false } }] },
    model: Keys.name,
    populate: [
      {
        path: 'average',
        select: 'timestamp average start_position cpm difference',
        model: Average.name,
      },
      {
        path: 'pwz',
        select: 'name position',
        model: Pvz.name,
        populate: {
          path: 'position',
          select: 'position timestamp difference promo_position cpm',
          model: Periods.name,
        },
      },
    ],
  }
]

export const ARTICLE_POPULATE_METRIC: PopulateOptions | (string | PopulateOptions)[] = [
  {
    path: 'keys',
    select: 'key average frequency active pwz active_sub',
    match: { active: true, active_sub: true },
    model: Keys.name,
    populate: [
      {
        path: 'average',
        select: 'timestamp average start_position cpm difference',
        model: Average.name,
      },
      {
        path: 'pwz',
        select: 'name position city',
        model: Pvz.name,
        populate: {
          path: 'position',
          select: 'position timestamp difference promo_position cpm',
          model: Periods.name,
        },
      },
    ],
  }
]

