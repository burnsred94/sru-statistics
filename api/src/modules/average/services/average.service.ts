import { Injectable } from '@nestjs/common';
import { AverageRepository } from '../repositories';
import { Types } from 'mongoose';
import { AverageStatus, IAverage } from 'src/interfaces';
import { MathUtils } from 'src/modules/utils/providers';
import { map } from 'lodash';

@Injectable()
export class AverageService {
  constructor(
    private readonly averageRepository: AverageRepository,
    private readonly mathUtils: MathUtils,
  ) { }

  async create(data: IAverage) {
    return await this.averageRepository.create(data);
  }

  async update(payload: { id: Types.ObjectId, average: number; key_id: Types.ObjectId }) {
    return await this.averageRepository.update(payload.id, payload.average);
  }

  async updateRefresh(id: Types.ObjectId) {
    return await this.averageRepository.refresh(id);
  }

  async updateDiff(average) {
    const first = average.at(1);
    const second = average.at(0);

    const data = await this.mathUtils.calculateDiff(
      { position: second.average },
      { position: first.average },
    );

    await this.averageRepository.updateDiff(second._id, data);
  }

}
