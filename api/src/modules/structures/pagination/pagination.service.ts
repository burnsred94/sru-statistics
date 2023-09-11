import { Injectable, Logger } from "@nestjs/common";
import { PaginationRepository } from "./repositories";
import { Pagination } from "./schemas";
import { Types } from "mongoose";

@Injectable()
export class PaginationService {
    protected readonly logger = new Logger(PaginationService.name);

    constructor(private readonly paginationRepository: PaginationRepository) { }


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
}