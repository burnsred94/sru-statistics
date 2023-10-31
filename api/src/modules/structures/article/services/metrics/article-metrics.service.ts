import { Injectable, Logger } from '@nestjs/common';
import { ArticleRepository } from '../../repositories'
import { HydratedDocument } from 'mongoose';
import { Article } from '../../schemas';
import { KeysService } from 'src/modules/structures/keys';
import { concatMap, from, } from 'rxjs';
import { MetricMathUtils } from 'src/modules/utils/providers';
import { Average } from 'src/modules/structures/average';
import { Pvz } from 'src/modules/structures/pvz';
import { Periods } from 'src/modules/structures/periods';
import { MetricsService } from 'src/modules/structures/metrics/services';

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
        this.documents = Promise.resolve(this.articleRepository.find({ active: true }))
        return this;
    }

    getKeywordsDocument() {
        Promise.resolve(this.documents)
            .then((async (documents) => {
                const complete = from(documents)
                    .pipe(concatMap(async (value) => {
                        const { _id, userId, keys } = value;

                        if (keys.length === 0) return value;

                        const elements = await this.keywordService.find({ _id: keys, active: true, $or: [{ active_sub: true }, { active_sub: { $exists: false } }] }, [
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
                        const cityMetric = await this.metricMathUtils.getCityMetric(addresses)
                        const table = await this.metricMathUtils.getTableMetric(elements, userId, _id, cityMetric);
                        return this.metricService.updateMetric(table)
                    }))
                    .subscribe({
                        next: (value) => {
                            if (value) {
                                console.log(`Update ${value._id}`)
                            }
                        },
                        complete: () => this.logger.log(`Folder metric update complete`)
                    },)
                    .closed

                if (complete) {
                    this.completeSwitch = complete
                }
            }))

        return this;
    }

}

