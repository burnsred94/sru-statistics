import { Injectable, Logger } from '@nestjs/common';
import { User } from 'src/modules/auth/user';
import { PvzRepository } from '../repositories';
import { Periods, PeriodsService } from '../../periods';
import { Types } from 'mongoose';
import { MathUtils } from 'src/modules/utils/providers';
import { StatisticsUpdateRMQ } from 'src/modules/rabbitmq/contracts/statistics';

@Injectable()
export class PvzService {
  protected readonly logger = new Logger(PvzService.name);

  constructor(
    private readonly pvzRepository: PvzRepository,
    private readonly periodsService: PeriodsService,
    private readonly mathUtils: MathUtils,
  ) { }

  async create(value, article: string, userId: User) {
    const date = await this.mathUtils.currentDate();
    const period = await this.periodsService.create('0', date);

    const pvz = await this.pvzRepository.create(
      {
        article: article,
        name: value.address,
        city: value.city,
        geo_address_id: value.addressId,
        position: [period],
        userId: userId,
      },
      { path: 'position', select: 'position', model: Periods.name },
    );
    return pvz;
  }

  async checkAndUpdate(id: Types.ObjectId) {
    const date = await this.mathUtils.currentDate();
    const address = await this.pvzRepository.findOne(
      { _id: id },
      { path: 'position', select: 'position', match: { timestamp: date }, model: Periods.name },
    );

    if (address.position.length > 0) {
      Promise.all(
        address.position.map(position => {
          return this.periodsService.update(position._id, {
            position: -3,
            promoPosition: null,
            cpm: 0,
            promotion: null,
          });
        }),
      );

      return address;
    } else {
      const period = await this.periodsService.create('0', date);

      const updateAddress = await this.pvzRepository.findOneAndUpdate(
        { _id: id },
        {
          $push: {
            position: period._id,
          },
        },
      );

      return updateAddress;
    }
  }

  //Обновление позиции после парсинга
  async update(data: StatisticsUpdateRMQ.Payload) {
    const periodUpdate = await this.periodsService.update(data.periodId, data.position);
    await this.updatePeriod(data.addressId);
    return periodUpdate ? true : false;
  }

  async updatePeriod(pvzId: Types.ObjectId) {
    const data = await this.pvzRepository.findOne(
      { _id: pvzId },
      { path: 'position', select: 'position', model: Periods.name },
    );
    if (data !== null || data.position.length > 0) {
      const firstItem = data.position.at(-1);
      const secondItem = data.position.at(-2);
      const result = await this.mathUtils.calculateDiff(firstItem, secondItem);
      await this.periodsService.updateDiff(firstItem._id, result);
    }
  }
}
