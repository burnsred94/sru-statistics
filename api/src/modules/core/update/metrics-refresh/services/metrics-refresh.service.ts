import { Injectable } from "@nestjs/common";
import { ArticleMetricsService } from "src/modules/structures/article/services/metrics";
import { FolderMetricsService } from "src/modules/structures/folders/services/metrics";


@Injectable()
export class MetricsRefreshService {
    constructor(
        private readonly articleMetricsService: ArticleMetricsService,
        private readonly folderMetricsService: FolderMetricsService,
    ) { }

    async taskMetricArticleUpdate() {
        this.articleMetricsService
            .getDocuments()
            .getKeywordsDocument()
    }

    async taskMetricsFolderUpdate() {
        this.folderMetricsService.updateAll();
    }
}