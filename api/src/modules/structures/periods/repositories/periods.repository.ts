import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Periods, PeriodsDocument } from '../schemas';
import { AbstractRepository } from 'src/modules/database';

@Injectable()
export class PeriodsRepository extends AbstractRepository<PeriodsDocument> {
  constructor(@InjectModel(Periods.name) readonly periodModel: Model<PeriodsDocument>) {
    super(periodModel);
  }
}
