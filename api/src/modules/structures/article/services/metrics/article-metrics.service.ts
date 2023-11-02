import { Injectable, Logger } from '@nestjs/common';
import { ArticleRepository } from '../../repositories'
import { HydratedDocument } from 'mongoose';
import { Article } from '../../schemas';
import { KeysService } from 'src/modules/structures/keys';
import { concatMap, from, } from 'rxjs';
import { MetricMathUtils } from 'src/modules/utils/providers';
import { MetricsService } from 'src/modules/structures/metrics/services';
import { Average } from 'src/modules/structures/average';
import { Pvz } from 'src/modules/structures/pvz';
import { Periods } from 'src/modules/structures/periods';


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
        this.documents = this.articleRepository.find({ active: true })
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

                                const elements = await this.keywordService.find({ _id: keys, active: true, active_sub: true }, [
                                    {
                                        path: 'average',
                                        select: 'timestamp average start_position cpm difference',
                                        model: Average.name,
                                    },
                                    {
                                        path: 'pwz',
                                        select: 'name position city',
                                        model: Pvz.name,
                                        populate: {
                                            path: 'position',
                                            select: 'position timestamp difference promo_position cpm',
                                            model: Periods.name,
                                        },
                                    },
                                ])
                                if (elements.length === 0) resolve([null, _id, index]);

                                const addresses = elements.flatMap((value) => value.pwz)
                                const cityMetric = await this.metricMathUtils.getCityMetric(addresses);
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

