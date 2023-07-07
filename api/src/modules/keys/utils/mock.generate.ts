import { Injectable, Logger } from '@nestjs/common';
import { map } from 'lodash';
import {
  IAverageGenerator,
  IKeyGenerator,
  IPwzGenerator,
} from 'src/interfaces';
import { AverageEntity } from 'src/modules/average';
import { PeriodsEntity } from 'src/modules/periods';

@Injectable()
export class MockGenerator {
  protected readonly logger = new Logger(MockGenerator.name);

  async keyGenerator(key, periods: string[]) {
    const typeKey = key as IKeyGenerator;
    const averageMock = await this.averageMock(typeKey.average, periods);
    const positionMock = await this.positionMock(typeKey.pwz, periods);

    return {
      _id: typeKey._id,
      key: typeKey.key,
      article: typeKey.article,
      userId: typeKey.userId,
      average: averageMock,
      pwz: positionMock,
    };
  }

  async averageMock(average, periods: string[]) {
    const averageTS = average as IAverageGenerator[];

    const averageMockData = map(periods, async period => {
      const find = averageTS.find(average => average.timestamp === period);
      return find ?? new AverageEntity({ average: '-' }).mock(period);
    });
    const resolved = await Promise.all(averageMockData);

    return resolved;
  }

  async positionMock(pwzs: IPwzGenerator[], periods: string[]) {
    const generatedMock = map(pwzs, async pwz => {
      const pwzPositionIterator = map(periods, date => {
        const find = pwz.position.find(pos => pos.timestamp === date);
        return find ?? new PeriodsEntity('-').mockPeriod(date);
      });

      return {
        _id: pwz._id,
        name: pwz.name,
        city: pwz.city,
        geo_address_id: pwz.geo_address_id,
        city_id: pwz.city_id,
        position: pwzPositionIterator,
      };
    });

    const resolved = await Promise.all(generatedMock);
    return resolved;
  }
}
