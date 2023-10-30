import { PopulateOptions } from 'mongoose';
import { Average } from 'src/modules/structures/average';
import { Keys } from 'src/modules/structures/keys';
import { Periods } from 'src/modules/structures/periods';
import { Pvz } from 'src/modules/structures/pvz';

export const ARTICLE_POPULATE: PopulateOptions | (string | PopulateOptions)[] = [
  {
    path: 'keys',
    select: 'key frequency pwz average',
    match: { active: true, $or: [{ active_sub: true }, { active_sub: { $exists: false } }] },
    model: Keys.name,
    populate: [
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
  }
];

