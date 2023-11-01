import { FilterQuery, PopulateOptions } from 'mongoose';
import { Average } from 'src/modules/structures/average';
import { Keys } from 'src/modules/structures/keys';
import { Periods } from 'src/modules/structures/periods';
import { Pvz } from 'src/modules/structures/pvz';

export const keysPopulateAndQuery = async (
  query: FilterQuery<any>,
): Promise<PopulateOptions | (string | PopulateOptions)[]> => {
  if (!query.period) query.period = {};
  let search = {};
  let sort = { frequency: 1 }; // default
  let city = {};

  if (query.search !== undefined) search = { key: { $regex: query.search, $options: 'i' } };

  if (query.sort !== undefined) sort = { frequency: Number(query.sort) };

  if (query.city !== undefined) city = { city: query.city };

  return [
    {
      path: 'keys',
      select: 'key average frequency active',
      match: { active: true, ...search },
      options: {
        sort: sort,
      },
      model: Keys.name,
      populate: [
        {
          path: 'average',
          select: 'timestamp average start_position cpm difference',
          match: { timestamp: { $in: query.period } },
          model: Average.name,
        },
        {
          path: 'pwz',
          select: 'name position',
          match: { ...city },
          model: Pvz.name,
          populate: {
            path: 'position',
            select: 'position timestamp difference promo_position cpm',
            match: { timestamp: { $in: query.period } },
            model: Periods.name,
          },
        },
      ],
    },
  ];
};


export const POPULATE_KEYS_REFRESH = [
  {
    path: 'keys',
    select: 'key average frequency active',
    match: { active: true },
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
      }
    ],
  },
];

