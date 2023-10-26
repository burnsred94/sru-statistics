import { Injectable } from "@nestjs/common";
import { HydratedDocument } from "mongoose";
import { SearchPositionRMQ } from "src/modules/rabbitmq/contracts/search";
import { Keys } from "src/modules/structures/keys";
import { Pvz } from "src/modules/structures/pvz";

@Injectable()
export class ParserIntegrationAdapter {

    async preparationData(keywords: HydratedDocument<Keys>): Promise<SearchPositionRMQ.Payload> {
        const addresses = keywords.pwz as unknown as HydratedDocument<Pvz>[];

        return {
            article: keywords.article,
            key: keywords.key,
            key_id: keywords._id,
            pvz: addresses.map((element: HydratedDocument<Pvz>) => {
                return {
                    name: element.name,
                    average_id: keywords.average.at(-1)._id,
                    addressId: element._id,
                    geo_address_id: element.geo_address_id,
                    periodId: element.position[0]._id,
                };
            }),
        }
    }
}   