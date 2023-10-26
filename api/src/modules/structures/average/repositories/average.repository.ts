import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Average, AverageDocument } from '../schemas';
import { Model } from 'mongoose';
import { AbstractRepository } from 'src/modules/database';

@Injectable()
export class AverageRepository extends AbstractRepository<AverageDocument> {
  constructor(@InjectModel(Average.name) readonly averageModel: Model<AverageDocument>) {
    super(averageModel);

  }
}
