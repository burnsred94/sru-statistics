import { Injectable, Logger } from '@nestjs/common';
import { ArticleRepository } from '../../repositories'
import { HydratedDocument } from 'mongoose';
import { Article } from '../../schemas';
import { Keys, KeysService } from 'src/modules/structures/keys';
import { concatMap, from, } from 'rxjs';
import { MetricMathUtils } from 'src/modules/utils/providers';
import { MetricsService } from 'src/modules/structures/metrics/services';
import { ARTICLE_POPULATE_METRIC } from '../../constants/populate';

@Injectable()
export class ArticleMetricsService {
    protected readonly logger = new Logger(ArticleMetricsService.name)

    documents: Promise<HydratedDocument<Article>[]>
    private completeSwitch: boolean = false;

    constructor(
        private readonly articleRepository: ArticleRepository,
        private readonly metricMathUtils: MetricMathUtils,
        private readonly keywordService: KeysService,
        private readonly metricService: MetricsService,
    ) { }

    getDocuments() {
        this.documents = this.articleRepository.find({ active: true }, ARTICLE_POPULATE_METRIC)
        return this;
    }

    getKeywordsDocument() {
        Promise.resolve(this.documents)
            .then((async (documents) => {
                const complete = from(documents)
                    .pipe(
                        concatMap(async (value, index) => {
                            return new Promise(async (resolve) => {
                                const { _id, userId, keys } = value;

                                const elements = keys as unknown as HydratedDocument<Keys>[]

                                if (elements.length === 0) resolve([null, _id, index]);

                                const addresses = elements.flatMap((value) => value.pwz)
                                const cityMetric = await this.metricMathUtils.getCityMetric(addresses);
                                console.log(cityMetric);
                                const table = await this.metricMathUtils.getTableMetric(elements, userId, _id, cityMetric);
                                resolve([this.metricService.updateMetric(table), _id, index])
                            })
                        }))
                    .subscribe({
                        next: ([init, _id, index]) => {
                            if (_id && init) {
                                this.logger.log(`Update ${_id} element: ${index + 1}`)
                            }
                        },
                        complete: () => this.logger.log(`Article metric update complete`)
                    },)
                    .closed

                if (complete) {
                    this.completeSwitch = complete
                }
            }))

        return this;
    }

}

