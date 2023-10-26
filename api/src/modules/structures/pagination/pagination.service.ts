import { Injectable, Logger } from '@nestjs/common';
import { PaginationRepository } from './repositories';
import { Pagination } from './schemas';
import { Types } from 'mongoose';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class PaginationService {
  protected readonly logger = new Logger(PaginationService.name);

  constructor(
    private readonly paginationRepository: PaginationRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(data?: Pagination) {
    if (data) {
      return await this.paginationRepository.create(data);
    }
  }

  async update(_id: Types.ObjectId, data: Pagination) {
    return await this.paginationRepository.findOneAndUpdate({ article_id: _id }, data);
  }

  async findOne(_id: Types.ObjectId) {
    return await this.paginationRepository.findOne(_id);
  }

  async findByArticleId(_id: Types.ObjectId) {
    return await this.paginationRepository.findOne({ article_id: _id });
  }

  @OnEvent('pagination.check')
  async checkPagination(payload: Pick<Pagination, 'article_id'>) {
    const find = await this.paginationRepository.findOne({
      article_id: new Types.ObjectId(payload.article_id),
    });

    if (!find) {
      const result = await this.paginationRepository.create({
        key_limit: 10,
        article_id: new Types.ObjectId(payload.article_id),
        page: 1,
      });
      await this.eventEmitter.emitAsync('pagination.create', {
        pagination_id: result._id,
        article_id: payload.article_id,
      });
    }
  }
}

