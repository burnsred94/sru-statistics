import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { User } from 'src/modules/auth/user';
import { PvzRepository } from '../repositories';
import { PeriodsService } from 'src/modules/periods';
import { StatusPvz } from 'src/interfaces';
import { UpdatePvzDto } from '../dto';
import { Types } from 'mongoose';
import { KeysService } from 'src/modules/keys';
import { chunk, forEach, map } from 'lodash';
import { PvzQueue } from './pvz-queue.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MathUtils } from 'src/modules/utils/providers';
import { EventsWS } from 'src/modules/article/events';

@Injectable()
export class PvzService {
  protected readonly logger = new Logger(PvzService.name);

  constructor(
    @Inject(forwardRef(() => KeysService))
    private readonly keysService: KeysService,
    private readonly pvzRepository: PvzRepository,
    private readonly periodsService: PeriodsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly pvqQueue: PvzQueue,
    private readonly mathUtils: MathUtils,
  ) { }

  async findUserStatus(userId: User, article: string) {
    return async () => {
      const count = await this.pvzRepository.findUserStatus(userId, article);
      return count > 0
        ? this.eventEmitter.emit(EventsWS.SEND_ARTICLES, { userId: userId })
        : { complete: true };
    };
  }

  async create(value, article: string, userId: User, keyId: string) {
    const period = await this.periodsService.create('Ожидается');
    const pvz = await this.pvzRepository.create({
      article: article,
      name: value.address,
      city: value.city,
      geo_address_id: value.addressId,
      position: [period],
      userId: userId,
      status: StatusPvz.WAIT_TO_SEND,
      active: true,
      key_id: keyId,
    });
    return pvz;
  }

  async update(data: UpdatePvzDto) {
    await this.periodsService.update(data.periodId, data.position);
    await this.keysService.updateAverage({ id: data.averageId, average: data.position, key_id: data.key_id })
    await this.updatePeriod(data.addressId);
  }

  async addedPosition(data, averageId) {
    return map(data, async (element) => {
      const period = await this.periodsService.create('Ожидается');
      const update = await this.pvzRepository.update(element._id, period);
      if (update) return { name: element.name, periodId: period._id, addressId: element._id, geo_address_id: element.geo_address_id, average_id: averageId }
    })
  }

  async updatePeriod(pvzId: Types.ObjectId) {
    const data = await this.pvzRepository.findPvz(pvzId);
    if (data.position.length > 0 || data !== null) {
      const firstItem = data.position.at(-1);
      const secondItem = data.position.at(-2);
      const result = await this.mathUtils.calculateDiff(firstItem, secondItem);
      await this.periodsService.updateDiff(firstItem._id, result);
    }
  }

  async periodRefresh(pvzId: Types.ObjectId) {
    const pvz = await this.pvzRepository.findAll({ _id: pvzId });
    const id = pvz[0].position.at(-1)._id;
    // await this.periodsService.update(id, "Ожидается")
  }

  async findById(id: Types.ObjectId) {
    return await this.pvzRepository.findPvz(id);
  }

  async initStatus(id: string, active: boolean) {
    await this.pvzRepository.initStatus(id, active);
  }
}
