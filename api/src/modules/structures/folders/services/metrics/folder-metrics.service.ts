import { Injectable, Logger } from "@nestjs/common";
import { HydratedDocument, Types } from "mongoose";
import { User } from "src/modules/auth";
import { IMetric } from "src/modules/structures/article/types/interfaces";
import { Keys, KeysService } from "src/modules/structures/keys";
import { KEYWORDS_METRIC_UPDATE } from "src/modules/structures/keys/constants";
import { MetricMathUtils } from "src/modules/utils/providers";
import { FolderRepository } from "../../repositories";
import { map, from } from "rxjs";
import { MetricsService } from "src/modules/structures/metrics/services";
import { POPULATE_KEYS_REFRESH } from "../../constants";

@Injectable()
export class FolderMetricsService {
    protected readonly logger = new Logger(FolderMetricsService.name);

    documents: Promise<HydratedDocument<Keys>[]>
    article: Types.ObjectId

    constructor(
        private readonly keywordService: KeysService,
        private readonly folderRepository: FolderRepository,
        private readonly metricMathUtils: MetricMathUtils,
        private readonly metricService: MetricsService
    ) { }

    updateAll() {
        this.folderRepository.find({}, POPULATE_KEYS_REFRESH)
            .then((elements) => {
                from(elements)
                    .pipe(map((element) => {
                        return { keywords: element.keys, article: element.article_id, user: element.user, _id: element._id }
                    }))
                    .subscribe({
                        next: ({ keywords, article, user, _id }) => {
                            this.documents = Promise.resolve(keywords as unknown as HydratedDocument<Keys>[])
                            this.article = article
                            this.folderMetric(null, user)
                                .then((data: IMetric) => {
                                    this.metricService.updateMetricFolder({ folder: _id, metric: data }, user)
                                })
                        },
                        complete: () => {
                            this.logger.log('Update metrics folder')
                        }
                    })

            })
    }

    setDocuments(keywords: Types.ObjectId[], article: Types.ObjectId) {
        this.documents = this.keywordService.find({ _id: keywords }, KEYWORDS_METRIC_UPDATE);
        this.article = article;
        return this
    }

    folderMetric(folder: Types.ObjectId, user: User) {
        return new Promise((resolve) => {
            Promise.resolve(this.documents)
                .then(async (keywords) => {
                    const elements = keywords as unknown as HydratedDocument<Keys>[]
                    const addresses = elements.flatMap((value) => value.pwz)
                    const cityMetric = await this.metricMathUtils.getCityMetric(addresses)
                    const table = await this.metricMathUtils.getTableMetric(keywords, user, this.article, cityMetric)
                    resolve(table);
                })
        })
    }
}