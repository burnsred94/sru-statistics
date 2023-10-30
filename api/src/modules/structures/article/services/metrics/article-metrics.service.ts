import { Injectable, Logger } from '@nestjs/common';
import { ArticleRepository } from '../../repositories'
import { HydratedDocument } from 'mongoose';
import { Article } from '../../schemas';
import { Keys } from 'src/modules/structures/keys';
import { from, map, } from 'rxjs';
import { ARTICLE_POPULATE } from '../../constants/populate';
import { IMetric } from '../../types/interfaces';
import { MetricMathUtils } from 'src/modules/utils/providers';



@Injectable()
export class ArticleMetricsService {
    protected readonly logger = new Logger(ArticleMetricsService.name)

    documents: Promise<HydratedDocument<Article>[]>
    private dataFromUpdate: Promise<IMetric>[] = [];
    private completeSwitch: boolean = false;

    constructor(
        private readonly articleRepository: ArticleRepository,
        private readonly metricMathUtils: MetricMathUtils,
    ) { }

    getDocuments() {
        this.documents = this.articleRepository.find({ active: true }, ARTICLE_POPULATE)
        return this
    }

    getKeywordsDocument() {
        Promise.resolve(this.documents)
            .then((async (documents) => {
                const complete = from(documents)
                    .pipe(map((value) => {
                        return { article: value._id, keywords: value.keys, user: value.userId }
                    }))
                    .subscribe({
                        next: async ({ article, keywords, user }) => {
                            const elements = keywords as unknown as HydratedDocument<Keys>[]
                            const addresses = elements.flatMap((value) => value.pwz)
                            const cityMetric = this.metricMathUtils.getCityMetric(addresses)
                            const table: Promise<IMetric> = this.metricMathUtils.getTableMetric(elements, user, article, cityMetric)
                            this.dataFromUpdate.push(table);
                        }
                    },)
                    .closed

                if (complete) {
                    Promise.all(this.dataFromUpdate)
                        .then(() => {
                            this.completeSwitch = complete
                        })
                }
            }))

        return this;
    }

    get() {
        return new Promise((resolve) => {
            if (this.completeSwitch) {
                const result = this.dataFromUpdate;
                resolve(result)
                this.dataFromUpdate = []
                this.completeSwitch = false;
            }
        })

    }
}

