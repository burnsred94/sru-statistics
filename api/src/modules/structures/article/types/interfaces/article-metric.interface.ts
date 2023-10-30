import { Types } from "mongoose"
import { User } from "src/modules/auth"

export interface IMetric {
    ads: { num: number, del: number },
    org: { num: number, del: number },
    ts: string,
    index: number,
    top_100: number,
    top_1000: number,
    article: Types.ObjectId
    user: User,
    city_metric?: ICityMetric[]
}

export interface ICityMetric {
    city: number,
    pos: number,
    dynamic: number
}