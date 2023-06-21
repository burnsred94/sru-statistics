import { Injectable } from '@nestjs/common';
import { PeriodsRepository } from '../repositories';

@Injectable()
export class PeriodsService {
  constructor(private readonly periodRepository: PeriodsRepository) {}

  async create(value: number, difference?: string) {
    return await this.periodRepository.create(
      value === 0 ? '2000+' : String(value),
      difference,
    );
  }
}
