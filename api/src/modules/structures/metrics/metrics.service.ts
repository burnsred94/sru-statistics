import { Injectable, Logger } from "@nestjs/common";
import { KeysService } from "../keys";
import { MetricsRepository } from "./repositories";
import { User } from "src/modules/auth";
import { Types } from "mongoose";

@Injectable()
export class MetricsService {
    protected readonly logger = new Logger(MetricsService.name);

    constructor(
        private readonly keyService: KeysService,
        private readonly metricsRepository: MetricsRepository,
    ) { }

    async getMetrics(user: User, article: string, _id: Types.ObjectId) {
        const metrics = await this.metricsRepository.findOne(_id);
        return metrics
    }
}