import { Injectable, Logger } from "@nestjs/common";
import { KeysService } from "../keys";
import { MetricsRepository } from "./repositories";
import { User } from "src/modules/auth";
import { Types } from "mongoose";
import { Cron, CronExpression } from "@nestjs/schedule";
import { OnEvent } from "@nestjs/event-emitter";
import { concatMap, from } from "rxjs";
import { ArticleService } from "../article";

//"0 9-23/3 * * *"

export interface PayloadMetric {
    _id: Types.ObjectId;
    user: Types.ObjectId;
}

@Injectable()
export class MetricsService {
    protected readonly logger = new Logger(MetricsService.name);

    constructor(
        private readonly articleService: ArticleService,
        private readonly keyService: KeysService,
        private readonly metricsRepository: MetricsRepository,
    ) { }

    async getMetrics(user: User, article: string, _id: Types.ObjectId) {
        const metrics = await this.metricsRepository.findOne(_id);
        return metrics
    }

    // @Cron(CronExpression.EVERY_10_SECONDS, { timeZone: "Europe/Moscow" })
    async dataGathering() {
        const data = await this.metricsRepository.find()
        console.log(data);
        const observer = from(data)
            .pipe(concatMap(async (item) => {
                const article = await this.articleService.findOne(item.article);

                const keys = await this.keyService.findByMany({ _id: article.keys }, "all");
                console.log(keys);

                return item
            }))

        observer.subscribe({
            next: (dataObserver) => {
                console.log(dataObserver);
            },
            complete: () => console.log("complete")
        })
    }

    @OnEvent("metric.created")
    async create(data: PayloadMetric) {
        await this.metricsRepository.create(data);
    }
}