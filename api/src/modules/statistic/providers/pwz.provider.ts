import { Injectable } from '@nestjs/common';
import { PwzRepository } from '../repositories/pwz.repository';
import { Result } from 'src/modules/interfaces/requested/create-requested.interface';
import { PeriodRepository } from '../repositories/periods.repository';

@Injectable()
export class PwzProvider {
  constructor(
    private readonly pwzRepository: PwzRepository,
    private readonly periodRepository: PeriodRepository,
  ) {}

  async create(value: Result, article: string, userId: string) {
    const period = await this.periodRepository.create(value.position);
    const pwz = await this.pwzRepository.create({
      article: article,
      name: value.address,
      position: [period],
      userId: userId,
    });
    return pwz;
  }
}
