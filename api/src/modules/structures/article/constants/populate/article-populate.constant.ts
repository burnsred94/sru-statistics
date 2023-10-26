import { PopulateOptions } from "mongoose";
import { Average } from "src/modules/structures/average";
import { Keys } from "src/modules/structures/keys";
import { Periods } from "src/modules/structures/periods";
import { Pvz } from "src/modules/structures/pvz";

export const ARTICLE_POPULATE: PopulateOptions | (string | PopulateOptions)[] = [
    {
        path: 'keys',
        select: 'key frequency pwz',
        match: { active: true },
        model: Keys.name,
        populate: {
            path: 'pwz',
            select: 'city position name',
            model: Pvz.name,
            populate: {
                path: 'position',
                select: 'position cpm promo_position timestamp difference',
                model: Periods.name
            }
        }
    },
    {
        path: 'average',
        select: "average start_position timestamp difference cpm",
        model: Average.name
    }
]