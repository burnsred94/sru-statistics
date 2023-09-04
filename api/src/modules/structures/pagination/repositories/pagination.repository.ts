import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from 'src/modules/database';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginationDocument, Pagination } from '../schemas';

@Injectable()
export class PaginationRepository extends AbstractRepository<PaginationDocument> {
    protected readonly logger = new Logger(PaginationRepository.name);

    constructor(@InjectModel(Pagination.name) private metricsModel: Model<PaginationDocument>) {
        super(metricsModel);
    }
}
