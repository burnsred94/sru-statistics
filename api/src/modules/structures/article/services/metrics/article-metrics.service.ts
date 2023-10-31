import { Injectable, Logger } from '@nestjs/common';
import { ArticleRepository } from '../../repositories'
import { HydratedDocument } from 'mongoose';
import { Article } from '../../schemas';
import { KeysService } from 'src/modules/structures/keys';
import { from, map, } from 'rxjs';
import { IMetric } from '../../types/interfaces';
import { MetricMathUtils } from 'src/modules/utils/providers';
import { Average } from 'src/modules/structures/average';
import { Pvz } from 'src/modules/structures/pvz';
import { Periods } from 'src/modules/structures/periods';

@Injectable()
export class ArticleMetricsService {
    protected readonly logger = new Logger(ArticleMetricsService.name)

    documents: Promise<HydratedDocument<Article>[]>
    private dataFromUpdate: Promise<IMetric>[] = [];
    private completeSwitch: boolean = false;

    constructor(
        private readonly articleRepository: ArticleRepository,
        private readonly metricMathUtils: MetricMathUtils,
        private readonly keywordService: KeysService
    ) { }

    getDocuments() {
        this.documents = Promise.resolve(this.articleRepository.find({ active: true }))
        return this;
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
                            new Promise(async (resolve) => {
                                const elements = await this.keywordService.find({ _id: keywords, active: true, $or: [{ active_sub: true }, { active_sub: { $exists: false } }] }, [
                                    {
                                        path: 'average',
                                        select: 'timestamp average start_position cpm difference',
                                        model: Average.name,
                                    },
                                    {
                                        path: 'pwz',
                                        select: 'name position',
                                        model: Pvz.name,
                                        populate: {
                                            path: 'position',
                                            select: 'position timestamp difference promo_position cpm',
                                            model: Periods.name,
                                        },
                                    },
                                ],)
                                const addresses = elements.flatMap((value) => value.pwz)
                                const cityMetric = this.metricMathUtils.getCityMetric(addresses)
                                const table: Promise<IMetric> = this.metricMathUtils.getTableMetric(elements, user, article, cityMetric)
                                resolve(this.dataFromUpdate.push(table));
                            })
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

