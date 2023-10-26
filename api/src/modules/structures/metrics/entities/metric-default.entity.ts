import { map } from "lodash";
import { Types } from "mongoose";
import { User } from "src/modules/auth";
import { IAdaptiveProfile } from "src/modules/integrations/profiles/types";
import { IMetricData } from "../types";


export class MetricDefault {
    userId: User;
    addresses: IAdaptiveProfile[]
    article: Types.ObjectId;
    defaultValue = 0;
    tableMarks = ['top_100', 'top_1000', 'indexes', 'middle_pos_organic', 'middle_pos_adverts']
    options: {
        day: '2-digit';
        month: '2-digit';
        year: 'numeric';
    };

    constructor(payload: IMetricData) {
        this.userId = payload.userId;
        this.addresses = payload.addresses;
        this.article = payload.article;
    }

    createDefault() {
        const timestamp = this.currentDate();
        const [top_100, top_1000, indexes, middle_pos_organic, middle_pos_adverts] = map(this.tableMarks, (mark) => this.table(timestamp, mark))
        const cities = this.tableCities();
        return {
            user: this.userId,
            article: this.article,
            middle_pos_cities: cities,
            ...top_100,
            ...top_1000,
            ...indexes,
            ...middle_pos_organic,
            ...middle_pos_adverts
        }
    }

    private table(timestamp: string, mark: string) {
        return {
            [mark]: [
                {
                    ts: timestamp,
                    met: this.defaultValue,
                }
            ]
        }
    }

    private tableCities() {
        return map(this.addresses, (address) => {
            return {
                city: address.city,
                pos: this.defaultValue,
                dynamic: this.defaultValue
            }
        })
    }


    private currentDate() {
        let date = new Date();
        date = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
        const formattedDate = new Date(date.setDate(date.getDate() + 0)).toLocaleDateString(
            'ru-RU',
            this.options,
        );
        return formattedDate;
    }
}