import { Injectable } from '@nestjs/common';
import { AverageRepository } from '../repositories';
import { Types } from 'mongoose';
import { IAverage } from 'src/interfaces';

@Injectable()
export class AverageService {
  constructor(private readonly averageRepository: AverageRepository) {}

  async create(data: IAverage) {
    return await this.averageRepository.create(data);
  }

  async update(id: Types.ObjectId, data: string) {
    await this.averageRepository.update(id, data);
  }
}
