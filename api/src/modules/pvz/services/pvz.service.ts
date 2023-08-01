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
    return pvz._id;
  }

  async update(data: UpdatePvzDto) {
    await this.periodsService.update(data.periodId, data.position);
    await this.pvzRepository.updateStatus(data.addressId);
    await this.updatePeriod(data.addressId);

    const findNonActive = await this.pvzRepository.findNonActive(data.key_id);

    if (findNonActive === 0) {
      await this.calculateAverage(data.key_id);
    }
  }

  async calculateAverage(payload: string) {
    const data = await this.pvzRepository.findActive(payload);
    const average = await this.mathUtils.calculateAverage(data);
    const checkAverage = average === 0 ? '1000+' : String(average);
    await this.keysService.updateAverage({
      average: checkAverage,
      key_id: payload,
    });
  }

  async findAndCreate() {
    const findPvz = await this.pvzRepository.findAll();

    const pvz = chunk(findPvz, 50);

    setImmediate(async () => {
      const data = map(pvz, elementAt =>
        this.pvqQueue.pushTask(() =>
          forEach(elementAt, async item => {
            const period = await this.periodsService.create('Ожидается');
            this.pvzRepository.update(item._id, period._id);
          }),
        ),
      );
      const resolved = await Promise.all(data);
      if (resolved) {
        this.eventEmitter.emit('update.started');
      }
    });
  }

  async updatePeriod(pvzId: Types.ObjectId) {
    const data = await this.pvzRepository.findPvz(pvzId);
    if (data.position.length > 0) {
      const firstItem = data.position.at(-1);
      const secondItem = data.position.at(-2);
      const result = await this.mathUtils.calculateDiff(firstItem, secondItem);
      await this.periodsService.updateDiff(firstItem._id, result);
    }
  }

  async findById(id: Types.ObjectId) {
    return await this.pvzRepository.findPvz(id);
  }

  async initStatus(id: string, active: boolean) {
    await this.pvzRepository.initStatus(id, active);
  }
}
