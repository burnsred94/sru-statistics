import { Injectable } from '@nestjs/common';
import { User } from 'src/modules/auth/user';
import { PvzRepository } from '../repositories';
import { Periods, PeriodsService } from 'src/modules/periods';
import { IResultAddress } from '../interfaces';

@Injectable()
export class PvzService {
  constructor(
    private readonly pvzRepository: PvzRepository,
    private readonly periodsService: PeriodsService,
  ) {}

  async create(value: IResultAddress, article: string, userId: User) {
    const period = await this.periodsService.create(value.position);
    const pvz = await this.pvzRepository.create({
      article: article,
      name: value.address,
      position: [period],
      userId: userId,
      active: true,
    });
    return pvz.populate({
      path: 'position',
      select: 'timestamp position',
      model: Periods.name,
    });
  }

  async updatePeriod(position, difference, id) {
    const period = await this.periodsService.create(position, difference);
    await this.pvzRepository.update(id, period);
  }
}
