import { Injectable } from '@nestjs/common';
import { PeriodsRepository } from '../repositories';
import { Types } from 'mongoose';

@Injectable()
export class PeriodsService {
  constructor(
    private readonly periodRepository: PeriodsRepository,
  ) { }

  async create(value: string, difference?: string) {
    return await this.periodRepository.create(value, difference);
  }

  async update(id: Types.ObjectId, position: string) {
    await this.periodRepository.update(id, position);
  }
}
