import { Injectable, Logger } from '@nestjs/common';
import { PeriodsRepository } from '../repositories';
import { Types } from 'mongoose';

@Injectable()
export class PeriodsService {
  protected readonly logger = new Logger(PeriodsService.name);

  constructor(private readonly periodRepository: PeriodsRepository) {}

  async create(difference = '0', date: string) {
    const result = await this.periodRepository.create({
      position: 'Ожидается',
      difference: difference,
      timestamp: date,
    });
    return result._id;
  }

  async update(
    id: Types.ObjectId,
    data: { cpm: number; promotion: number; promoPosition: number; position: number },
  ) {
    if (data.position === -3) {
      return await this.periodRepository.findOneAndUpdate({ _id: id }, { position: 'Ожидается' });
    }

    if (data.position > 0) {
      return await this.periodRepository.findOneAndUpdate(
        { _id: id },
        {
          cpm: data.promoPosition > 0 ? String(data.cpm) : null,
          promo_position: data.promoPosition > 0 ? String(data.promoPosition) : null,
          position: String(data.position),
        },
      );
    } else {
      const pos = data.position === -1 ? '1000+' : data.position === -2 ? 'Нет данных' : '1000+';
      return await this.periodRepository.findOneAndUpdate({ _id: id }, { position: pos });
    }
  }

  async updateDiff(id: Types.ObjectId, diff: string) {
    await this.periodRepository.findOneAndUpdate({ _id: id }, { difference: diff });
  }
}
