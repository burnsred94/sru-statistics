import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { User } from 'src/modules/auth/user';
import { PvzRepository } from '../repositories';
import { PeriodsService } from 'src/modules/periods';
import { StatusPvz } from 'src/interfaces';
import { UpdatePvzDto } from '../dto';
import { PvzUtils } from '../utils';
import { Types } from 'mongoose';
import { KeysService } from 'src/modules/keys';

@Injectable()
export class PvzService {
  protected readonly logger = new Logger(PvzService.name);
  constructor(
    @Inject(forwardRef(() => KeysService))
    private readonly keysService: KeysService,
    private readonly pvzRepository: PvzRepository,
    private readonly periodsService: PeriodsService,
    private readonly pvzUtils: PvzUtils,
  ) {}

  async create(value, article: string, userId: User, keyId: string) {
    const period = await this.periodsService.create('Ожидается');
    const pvz = await this.pvzRepository.create({
      article: article,
      name: value.address,
      geo_address_id: value.addressId,
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
    await this.updatePeriod(data.addressId);

    const findNonActive = await this.pvzRepository.findNonActive(data.key_id);

    if (findNonActive === 0) {
      await this.calculateAverage(data.key_id);
    }
  }

  async calculateAverage(payload: string) {
    const data = await this.pvzRepository.findActive(payload);
    const average = await this.pvzUtils.calculateAverage(data);
    const checkAverage = average === 0 ? '1000+' : String(average);
    await this.keysService.updateAverage({
      average: checkAverage,
      key_id: payload,
    });
  }

  async findAndCreate() {
    const findPvz = await this.pvzRepository.findAll();
    let count = 0;
    while (findPvz.length > count) {
      const period = await this.periodsService.create('Ожидается');
      await this.pvzRepository.update(findPvz[count]._id, period._id);
      count++;
    }

    if (count === findPvz.length) {
      return { status: true };
    }
  }

  async updatePeriod(pvzId: Types.ObjectId) {
    const data = await this.pvzRepository.findPvz(pvzId);
    if (data.position.length > 0) {
      const firstItem = data.position.at(-1);
      const secondItem = data.position.at(-2);
      const result = await this.pvzUtils.calculateDiff(firstItem, secondItem);
      await this.periodsService.updateDiff(firstItem._id, result);
    }
  }
}
