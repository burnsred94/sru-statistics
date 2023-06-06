import { compact, map, uniqBy } from 'lodash';
import { Types } from 'mongoose';
import {
  IArticleCron,
  ICreateRequest,
  ReduceSearchResult,
  Result,
} from 'src/modules/interfaces';

export class ParsersData {
  async parseReduce(dataSearch: ReduceSearchResult[]) {
    const result = map(dataSearch.flat(), value => {
      const { data } = value;

      return {
        city: value.city,
        _id: value._id,
        data: compact(data).reduce((accumulator, array) => {
          array.forEach(object => {
            const index = accumulator.findIndex(
              item => item.key === object.key,
            );
            if (index === -1) {
              accumulator.push({
                key: object.key,
                result: [object.result] as Result[],
              });
            } else {
              const accumulatorResult = accumulator[index].result as Result[];
              accumulatorResult.push(object.result as Result);
            }
          });
          return accumulator;
        }, []),
      };
    });

    return result;
  }

  async formatData(resultSearch) {
    const dataForCreate = resultSearch.flat() as ICreateRequest[];
    const dataReduce = dataForCreate.reduce((accumulator, { city, data }) => {
      if (data) {
        accumulator[city] = [...(accumulator[city] || []), data];
      }
      return accumulator;
    }, {});

    return Object.keys(dataReduce).map((key: string | number) => {
      const { _id } = dataForCreate.find(({ city }) => city === key);
      const data = dataReduce[key];
      return { city: key, _id, data };
    });
  }

  async mergedData(data) {
    const mergedData = data.reduce((accumulator, current) => {
      const existingItem = accumulator.find(
        item => item.data[0].key === current.data[0].key,
      );
      if (existingItem) {
        existingItem.data.push(current.data[0]);
      } else {
        accumulator.push(current);
      }
      return accumulator;
    }, []);

    const resultArray = mergedData.map(item => {
      const result = item.data.map(object => object.result);
      return { key: item.data[0].key, result };
    });

    return resultArray;
  }

  async fetchFormattedData(article) {
    const data = article as IArticleCron;

    const dataUpdate = map(data.keys, item => {
      return map(item.pwz, address => {
        return {
          _id: address._id as unknown as Types.ObjectId,
          article: data.article,
          address: address.name,
          keys: [item.key],
        };
      });
    }).flat();

    return dataUpdate;
  }
}
