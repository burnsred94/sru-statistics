import { Injectable, Logger } from "@nestjs/common";
import { AbstractRepository } from "src/modules/database";
import { Metrics, MetricsDocument } from "../schemas";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

@Injectable()
export class MetricsRepository extends AbstractRepository<MetricsDocument> {
    protected readonly logger = new Logger(MetricsRepository.name);

    constructor(@InjectModel(Metrics.name) private metricsModel: Model<MetricsDocument>) {
        super(metricsModel);
    }
}