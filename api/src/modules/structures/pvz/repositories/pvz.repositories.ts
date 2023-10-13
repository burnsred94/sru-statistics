import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Injectable, Logger } from '@nestjs/common';
import { Pvz, PvzDocument } from '../schemas';
import { AbstractRepository } from 'src/modules/database';

@Injectable()
export class PvzRepository extends AbstractRepository<PvzDocument> {
  protected readonly logger = new Logger(PvzRepository.name);

  constructor(@InjectModel(Pvz.name) readonly pvzModel: Model<PvzDocument>) {
    super(pvzModel);
  }
}
