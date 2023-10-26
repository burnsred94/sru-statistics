import { Injectable, Logger } from "@nestjs/common";
import { Address, IAdaptiveProfile, IProfileApiResponse } from "../types";
import { map } from "lodash";

@Injectable()
export class ProfileIntegrationAdapter {
    private readonly logger = new Logger(ProfileIntegrationAdapter.name);

    async adaptiveResponseDataProfile({ towns }: IProfileApiResponse): Promise<IAdaptiveProfile[]> {
        try {
            return map(towns, ({ city, _id, addresses }) => {
                return this.addressDestruction(addresses, city, _id);
            })
                .flat()
        } catch (error) {
            this.logger.error(error.message);
            throw error;
        }
    };

    private addressDestruction(address: Address[], city: string, city_id: string): IAdaptiveProfile[] {
        return map(address, ({ address, addressId }) => ({ address, addressId, city, city_id }));
    };
}