import { Injectable } from '@nestjs/common';
import { AverageRepository } from '../repositories';
import { IAverage } from '../interfaces';

@Injectable()
export class AverageService {
  constructor(private readonly averageRepository: AverageRepository) {}

  async create(data: IAverage) {
    return await this.averageRepository.create(data);
  }
}
