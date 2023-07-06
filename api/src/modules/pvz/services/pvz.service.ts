import { Injectable, Logger } from '@nestjs/common';
import { User } from 'src/modules/auth/user';
import { PvzRepository } from '../repositories';
import { PeriodsEntity, PeriodsService } from 'src/modules/periods';
import { StatusPvz } from 'src/interfaces';
import { UpdatePvzDto } from '../dto';
import { Types } from 'mongoose';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { EventsAverage } from 'src/modules/article/events';
import { PvzUtils } from '../utils';
import { Cron, CronExpression } from '@nestjs/schedule';
import { forEach } from 'lodash';

@Injectable()
export class PvzService {
  protected readonly logger = new Logger(PvzService.name);


  constructor(
    private readonly pvzRepository: PvzRepository,
    private readonly periodsService: PeriodsService,
    private readonly pvzUtils: PvzUtils,
    private readonly eventEmitter: EventEmitter2
  ) { }

  async create(value, article: string, userId: User, keyId: string) {
    const period = await this.periodsService.create('Ожидается');
    const pvz = await this.pvzRepository.create({
      article: article,
      name: value.address,
      position: [period],
      userId: userId,
      status: StatusPvz.PENDING,
      active: true,
      key_id: keyId,
      city: value.city,
      city_id: value.city_id,
    });
    return pvz._id;
  }

  async update(data: UpdatePvzDto) {
    await this.periodsService.update(data.periodId, data.position);
    await this.pvzRepository.updateStatus(data.addressId);

    const findNonActive = await this.pvzRepository.findNonActive(data.key_id);


    if (findNonActive === 0) {
      this.eventEmitter.emit(EventsAverage.CALCULATE_AVERAGE, data.key_id);
    }
  }

  @OnEvent(EventsAverage.CALCULATE_AVERAGE)
  async calculateAverage(payload: string) {
    const data = await this.pvzRepository.findActive(payload)
    const average = await this.pvzUtils.calculateAverage(data);
    const checkAverage = average === 0 ? '1000+' : String(average);
    this.eventEmitter.emit(EventsAverage.UPDATE_AVERAGE, { average: checkAverage, key_id: payload });
  }

  async findAndCreate() {
    const findPvz = await this.pvzRepository.findAll()
    forEach(findPvz, async (pvz) => {
      const period = await this.periodsService.create('Ожидается');
      await this.pvzRepository.update(pvz._id, period._id)
    })

    return { status: true }
  }

  // async updatePeriod(position, difference, id) {
  //   const period = await this.periodsService.create(position, difference);
  //   await this.pvzRepository.update(id, period);
  // }
}
