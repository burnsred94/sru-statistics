import { Injectable, Logger } from '@nestjs/common';
import { IAverage, IKey, IPwz } from './interfaces';
import { map } from 'lodash';
import { AverageEntity } from 'src/modules/average';
import { PeriodsEntity } from 'src/modules/periods';

@Injectable()
export class MockGenerator {
  protected readonly logger = new Logger(MockGenerator.name);

  async keyGenerator(key, periods: string[]) {
    const typeKey = key as IKey;
    const averageMock = await this.averageMock(typeKey.average, periods);
    const positionMock = await this.positionMock(typeKey.pwz, periods);

    return {
      _id: typeKey._id,
      key: typeKey.key,
      userId: typeKey.userId,
      city_id: typeKey.city_id,
      average: averageMock,
      pwz: positionMock,
      __v: typeKey.__v,
    };
  }

  async averageMock(average, periods: string[]) {
    const averageTS = average as IAverage[];

    const averageMockData = map(periods, async period => {
      const find = averageTS.find(average => average.timestamp === period);
      return find ?? new AverageEntity({ average: '0' }).mock(period);
    });
    const resolved = await Promise.all(averageMockData);

    return resolved;
  }

  async positionMock(pwzs: IPwz[], periods: string[]) {
    const generatedMock = map(pwzs, async pwz => {
      const pwzPositionIterator = map(periods, date => {
        const find = pwz.position.find(pos => pos.timestamp === date);
        return find ?? new PeriodsEntity('0').mockPeriod(date);
      });
      return {
        _id: pwz._id,
        name: pwz.name,
        position: pwzPositionIterator,
      };
    });

    const resolved = await Promise.all(generatedMock);
    return resolved;
  }
}
