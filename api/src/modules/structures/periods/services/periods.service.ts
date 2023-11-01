import { Injectable, Logger } from '@nestjs/common';
import { PeriodsRepository } from '../repositories';
import { Types } from 'mongoose';
import { DEFAULT_DATE } from 'src/types';
import { IUpdateSearch } from 'src/types/interfaces';

@Injectable()
export class PeriodsService {
  protected readonly logger = new Logger(PeriodsService.name);

  constructor(private readonly periodRepository: PeriodsRepository) { }

  async create(difference = '0', date: string) {
    const result = await this.periodRepository.create({
      position: DEFAULT_DATE.WAITING_DATA,
      difference: difference,
      timestamp: date,
    });
    return result._id;
  }

  async update(_id: Types.ObjectId, data: IUpdateSearch) {
    if (data.position === -3) {
      return await this.periodRepository.findOneAndUpdate(
        { _id },
        { position: DEFAULT_DATE.WAITING_DATA, cpm: null, difference: '0', promo_position: null },
      );
    }

    if (data.position > 0) {
      return await this.periodRepository.findOneAndUpdate(
        { _id },
        {
          cpm: data.promoPosition > 0 ? String(data.cpm) : null,
          promo_position: data.promoPosition > 0 ? String(data.promoPosition) : null,
          position: String(data.position),
        },
      );
    } else {
      const pos =
        data.position === -1
          ? DEFAULT_DATE.NOT_FIND_LIMIT
          : data.position === -2
            ? DEFAULT_DATE.NOT_FIND
            : DEFAULT_DATE.NOT_FIND_LIMIT;
      return await this.periodRepository.findOneAndUpdate({ _id }, { position: pos });
    }
  }

  async updateDiff(_id: Types.ObjectId, diff: string) {
    await this.periodRepository.findOneAndUpdate({ _id }, { difference: diff });
  }
}
