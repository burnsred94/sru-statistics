import { Injectable } from "@nestjs/common";
import { forEach } from "lodash";
import { ArticleMetricsService } from "src/modules/structures/article/services/metrics";
import { IMetric } from "src/modules/structures/article/types/interfaces";
import { FolderMetricsService } from "src/modules/structures/folders/services/metrics";
import { MetricsService } from "src/modules/structures/metrics/services";


@Injectable()
export class MetricsRefreshService {
    constructor(
        private readonly articleMetricsService: ArticleMetricsService,
        private readonly metricService: MetricsService,
        private readonly folderMetricsService: FolderMetricsService,
    ) { }

    async taskMetricArticleUpdate() {
        const service = this.articleMetricsService

        const documents = service
            .getDocuments()
            .getKeywordsDocument()
            .get()

        documents.then((elements: Array<Promise<IMetric>>) => {
            forEach(elements, (element) => {
                Promise.resolve(element)
                    .then((value) => {
                        this.metricService.updateMetric(value);
                    })
            })
        });

    }

    async taskMetricsFolderUpdate() {
        this.folderMetricsService.updateAll();
    }
}