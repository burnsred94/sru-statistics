import { FilterQuery, PopulateOptions } from "mongoose";
import { Average } from "src/modules/structures/average";
import { Keys } from "src/modules/structures/keys";
import { Periods } from "src/modules/structures/periods";
import { Pvz } from "src/modules/structures/pvz";


export const keysPopulate = async (query: FilterQuery<any>): Promise<PopulateOptions | (string | PopulateOptions)[]> => {
    if (!query.period) query.period = {};

    return [
        {
            path: 'keys', select: "key average pwz frequency", model: Keys.name,
            populate: [
                { path: 'average', select: "average timestamp start_position cpm", model: Average.name, match: { timestamp: { $in: query.period } } },
                {
                    path: 'pwz', select: "position name", model: Pvz.name,
                    populate: {
                        path: 'position', select: "position timestamp cpm promo_position difference", model: Periods.name, match: { timestamp: { $in: query.period } }
                    }
                }
            ],
        }
    ]
}
