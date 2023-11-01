import { Injectable } from "@nestjs/common";
import { HydratedDocument, Types } from "mongoose";
import { from, lastValueFrom, map, reduce } from "rxjs";
import { User } from "src/modules/auth";
import { ICityMetric, IMetric } from "src/modules/structures/article/types/interfaces";
import { Keys } from "src/modules/structures/keys";

@Injectable()
export class MetricMathUtils {

    async getTableMetric(keywords: HydratedDocument<Keys>[], user: User, article: Types.ObjectId, cityMetric: ICityMetric[]): Promise<IMetric> {

        const average: any = keywords.map(value_1 => {
            return value_1?.average.at(-1) === undefined ? 0 : value_1.average.at(-1);
        });

        return average.reduce(
            (accumulator, value_2) => {
                if (value_2.average !== undefined &&
                    value_2.average !== null &&
                    value_2.average.length < 4) {
                    accumulator.index = accumulator.index + 1;

                    if (value_2.average <= 100) accumulator.top_100 = accumulator.top_100 + 1;
                    accumulator.top_1000 = accumulator.top_1000 + 1;

                    if (value_2.start_position) {
                        accumulator.ads.num = accumulator.ads.num + Number(value_2.average);
                        accumulator.ads.del = accumulator.ads.del + 1;
                    } else {
                        accumulator.org.num = accumulator.org.num + Number(value_2.average);
                        accumulator.org.del = accumulator.org.del + 1;
                    }
                }
                return accumulator;
            }, {
            ads: { num: 0, del: 0 },
            org: { num: 0, del: 0 },
            ts: new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }).split(',')[0],
            index: 0,
            top_100: 0,
            top_1000: 0,
            article,
            user,
            city_metric: cityMetric
        });

    }

    getCityMetric(address) {
        const observable = from(address)
            .pipe(
                reduce((accumulator, value: any) => {
                    let pos = 0;
                    let old = 0;

                    if (
                        !value.position.at(-1)?.cpm !== undefined &&
                        value.position.at(-1)?.cpm !== null &&
                        value.position.at(-1)?.cpm !== '0'
                    ) {
                        pos = Number.isNaN(+value.position.at(-1)?.promo_position)
                            ? 0
                            : Number(value.position.at(-1).promo_position);
                        old = Number.isNaN(+value.position.at(-2)?.promo_position)
                            ? 0
                            : Number(value.position.at(-2).promo_position);
                    } else if (
                        (value.position.at(-1)?.cpm !== undefined && value.position.at(-1)?.cpm === null) ||
                        value.position.at(-1)?.cpm === '0'
                    ) {
                        pos = Number.isNaN(+value.position.at(-1)?.position)
                            ? 0
                            : Number(value.position.at(-1).position);
                        old = Number.isNaN(+value.position.at(-2)?.position)
                            ? 0
                            : Number(value.position.at(-2).position);
                    }

                    const index = accumulator.findIndex(object => object.city === value.city);

                    if (index === -1) {
                        accumulator.push({
                            city: value.city,
                            new: pos,
                            old: old,
                            del: pos > 0 ? 1 : 0,
                            old_del: old > 0 ? 1 : 0,
                        });
                    } else {
                        Number.isNaN(pos) ? null : (accumulator[index].new = accumulator[index].new + pos),
                            pos > 0 ? (accumulator[index].del = accumulator[index].del + 1) : null;

                        Number.isNaN(old) ? null : (accumulator[index].old = accumulator[index].old + old),
                            old > 0 ? (accumulator[index].old_del = accumulator[index].old_del + 1) : null;
                    }
                    return accumulator;
                }, []),
            )
            .pipe(
                map(data => {
                    return data.map(value => {
                        let current = Math.round(value.new / value.del);
                        current = Number.isNaN(current) ? 0 : current;
                        let past = current;
                        if (value.old !== 0) past = Math.round(value.old / value.old_del);

                        return { city: value.city, pos: current, dynamic: past - current };
                    });
                }),
            );

        return lastValueFrom(observable);
    }
}