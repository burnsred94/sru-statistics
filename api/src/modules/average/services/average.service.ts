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

  async find(ids: Types.ObjectId[]) {
    return map(ids, async id => await this.averageRepository.findOne(id));
  }

  async update(id: Types.ObjectId, data: string, key) {
    const update = await this.averageRepository.update(id, data);

    if (update && key.average.length > 1) {
      const reverse = key.average.reverse();
      const averageData = await this.find([reverse.at(1)._id, reverse.at(0)._id]);
      const resolved = await Promise.all(averageData);
      await this.updateDiff(resolved[0], resolved[1]);
    }
  }

  async updateDiff(first, second) {
    if (second !== undefined) {
      const data = await this.mathUtils.calculateDiff(
        { position: second.average },
        { position: first.average },
      );
      await this.averageRepository.updateDiff(second._id, data);
    }
  }

  async statusUp(ids: Types.ObjectId[], status: AverageStatus) {
    await this.averageRepository.statusUp(ids, status);
  }

  async getCountToParse(status: AverageStatus, userId: number): Promise<number> {
    return userId === undefined ? 
    this.averageRepository.getCountDocuments({ status_updated: status }) : 
    this.averageRepository.getCountDocuments({ status_updated: status, userId: userId });
  }
}
