import { Injectable, Logger } from '@nestjs/common';
import { User } from 'src/modules/auth/user';
import { PvzRepository } from '../repositories';
import { Periods, PeriodsService } from '../../periods';
import { Types } from 'mongoose';
import { map } from 'lodash';
import { MathUtils } from 'src/modules/utils/providers';
import { from, lastValueFrom, reduce, map as rxjs_map } from 'rxjs';
import { StatisticsUpdateRMQ } from 'src/modules/rabbitmq/contracts/statistics';


@Injectable()
export class PvzService {
  protected readonly logger = new Logger(PvzService.name);

  constructor(
    private readonly pvzRepository: PvzRepository,
    private readonly periodsService: PeriodsService,
    private readonly mathUtils: MathUtils,
  ) { }

  //Расчет позиций для метрики по городам
  async findByMetrics(user: number, article: string) {
    const observable = from(
      await this.pvzRepository.find(
        { userId: user, article: article, active: true },
        { path: 'position', select: 'position promo_position cpm', model: Periods.name },
      ),
    )
      .pipe(
        reduce((accumulator, value: any) => {
          let pos = 0;
          let old = 0;

          if (
            !value.position.at(-1)?.cpm !== undefined &&
            value.position.at(-1)?.cpm !== null &&
            value.position.at(-1)?.cpm !== '0'
          ) {
            pos = Number.isNaN(+value.position.at(-1)?.promo_position)
              ? 0
              : Number(value.position.at(-1).promo_position);
            old = Number.isNaN(+value.position.at(-2)?.promo_position)
              ? 0
              : Number(value.position.at(-2).promo_position);
          } else if (
            (value.position.at(-1)?.cpm !== undefined && value.position.at(-1)?.cpm === null) ||
            value.position.at(-1)?.cpm === '0'
          ) {
            pos = Number.isNaN(+value.position.at(-1)?.position)
              ? 0
              : Number(value.position.at(-1).position);
            old = Number.isNaN(+value.position.at(-2)?.position)
              ? 0
              : Number(value.position.at(-2).position);
          }

          const index = accumulator.findIndex(object => object.city === value.city);

          if (index === -1) {
            accumulator.push({
              city: value.city,
              new: pos,
              old: old,
              del: pos > 0 ? 1 : 0,
              old_del: old > 0 ? 1 : 0,
            });
          } else {
            Number.isNaN(pos) ? null : (accumulator[index].new = accumulator[index].new + pos),
              pos > 0 ? (accumulator[index].del = accumulator[index].del + 1) : null;

            Number.isNaN(old) ? null : (accumulator[index].old = accumulator[index].old + old),
              old > 0 ? (accumulator[index].old_del = accumulator[index].old_del + 1) : null;
          }
          return accumulator;
        }, []),
      )
      .pipe(
        rxjs_map(data => {
          return map(data, value => {
            let current = Math.round(value.new / value.del);
            current = Number.isNaN(current) ? 0 : current;
            let past = current;
            if (value.old !== 0) past = Math.round(value.old / value.old_del);

            return { city: value.city, pos: current, dynamic: past - current };
          });
        }),
      );

    return lastValueFrom(observable);
  }

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
    const address = await this.pvzRepository.findOne({ _id: id },
      { path: 'position', select: 'position', match: { timestamp: date }, model: Periods.name }
    );

    if (address.position.length > 0) {
      Promise.all(address.position.map((position) => {
        return this.periodsService.update(position._id, { position: -3, promoPosition: null, cpm: 0, promotion: null });
      }));

      return address;

    } else {
      const period = await this.periodsService.create('0', date);

      const updateAddress = await this.pvzRepository.findOneAndUpdate({ _id: id }, {
        $push: {
          position: period._id,
        },
      });

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
