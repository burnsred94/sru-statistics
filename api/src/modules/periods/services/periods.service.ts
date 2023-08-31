import { Injectable } from '@nestjs/common';
import { PeriodsRepository } from '../repositories';
import { Types } from 'mongoose';
import { UpdatePvzDto } from 'src/modules/pvz/dto';

@Injectable()
export class PeriodsService {
  constructor(private readonly periodRepository: PeriodsRepository) { }

  async create(value: string, difference?: string) {
    return await this.periodRepository.create(value, difference);
  }

  async update(id: Types.ObjectId, position: { cpm: number, promotion: number, promoPosition: number, position: number }) {
    await this.periodRepository.update(id, position)
  }

  async updateDiff(id: Types.ObjectId, diff: string) {
    await this.periodRepository.updateDiff(id, diff);
  };
}
