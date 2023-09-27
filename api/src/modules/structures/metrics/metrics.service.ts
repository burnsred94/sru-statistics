import { Injectable, Logger } from '@nestjs/common';
import { KeysService } from '../keys';
import { MetricsRepository } from './repositories';
import { User } from 'src/modules/auth';
import { Types } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import { OnEvent } from '@nestjs/event-emitter';
import { concatMap, from } from 'rxjs';
import { ArticleService } from '../article';
import { PvzService } from '../pvz';
import { MetricEntity } from './entities/metric.entity';
import { Average } from '../average';

//"0 9-23/3 * * *"

export interface PayloadMetric {
    _id: Types.ObjectId;
    user: User;
}

@Injectable()
export class MetricsService {
    protected readonly logger = new Logger(MetricsService.name);

    constructor(
        private readonly articleService: ArticleService,
        private readonly keyService: KeysService,
        private readonly pvzService: PvzService,
        private readonly metricsRepository: MetricsRepository,
    ) { }

    async getMetrics(user: User, _id: Types.ObjectId) {
        const id = new Types.ObjectId(_id);
        const metrics = await this.metricsRepository.findOne({ article: id });
        return {
            _id: metrics._id,
            top_100: {
                num: metrics.top_100.at(-1).met,
                data: metrics.top_100,
            },
            top_1000: {
                num: metrics.top_1000.at(-1).met,
                data: metrics.top_1000,
            },
            indexes: {
                num: metrics.indexes.at(-1).met,
                data: metrics.indexes,
            },
            middle_pos_organic: {
                num: metrics.middle_pos_organic.at(-1).met,
                data: metrics.middle_pos_organic
            },
            middle_pos_adverts: {
                num: metrics.middle_pos_adverts.at(-1).met,
                data: metrics.middle_pos_adverts
            },
            middle_pos_cities: metrics.middle_pos_cities
        };
    }

    @Cron("0 9-23/3 * * *", { timeZone: "Europe/Moscow" })
    @OnEvent("metric.gathering")
    async dataGathering(payload?) {
        from(
            payload === undefined ?
                await this.metricsRepository.find() :
                await this.metricsRepository.find(payload)
        )
            .pipe(
                concatMap(async item => {
                    const article = await this.articleService.findOne(item.article);
                    if (article === null) {
                        return null
                    }
                    const keys = await this.keyService.find({ _id: article.keys }, { path: 'average', select: 'average', model: Average.name });
                    const observer = await this.pvzService.findByMetrics(item.user, article.article);


                    const average: any = keys.map((value) => {
                        return value?.average.at(-1) === undefined ? 0 : value.average.at(-1);
                    })


                    return average.reduce((accumulator, value) => {

                        if (value.average !== undefined && value.average !== null && value.average.length < 4) {
                            accumulator.index = accumulator.index + 1;

                            if (value.average <= 100) accumulator.top_100 = accumulator.top_100 + 1;
                            accumulator.top_1000 = accumulator.top_1000 + 1;

                            if (value.start_position) {
                                accumulator.ads.num = (accumulator.ads.num + Number(value.average));
                                accumulator.ads.del = accumulator.ads.del + 1;
                            } else {
                                accumulator.org.num = (accumulator.org.num + Number(value.average));
                                accumulator.org.del = accumulator.org.del + 1;
                            }
                        }
                        return accumulator;

                    }, {
                        ads: { num: 0, del: 0 },
                        org: { num: 0, del: 0 },
                        ts: new Date().toLocaleString("ru-RU", { timeZone: "Europe/Moscow" }).split(",")[0],
                        index: 0,
                        top_100: 0,
                        top_1000: 0,
                        article: item.article,
                        user: item.user,
                        city_metric: observer
                    });

                })
            )
            .subscribe({
                next: async dataObserver => {
                    if (!dataObserver) return;

                    const find = await this.metricsRepository.findOne({ user: dataObserver.user, city: dataObserver.city });
                    const metric = await new MetricEntity().initMetric(dataObserver, find);
                    await this.metricsRepository.findOneAndUpdate({ user: dataObserver.user, article: dataObserver.article }, metric);
                },
                complete: () => console.log('complete'),
                error: (error) => this.logger.error(error.message),
            });
    }

    @OnEvent('metric.created')
    async create(data: PayloadMetric) {
        await this.metricsRepository.create(data);
        await this.dataGathering(data)
    }

    @OnEvent('metric.checked')
    async checkMetric(payload: PayloadMetric) {
        const check = await this.metricsRepository.findOne(payload);
        if (!check) await this.metricsRepository.create(payload), await this.dataGathering(payload);

    }
}
