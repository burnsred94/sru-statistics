import { Injectable } from "@nestjs/common";
import { Address, IAdaptiveProfile, IProfileApiResponse } from "../types";
import { map } from "lodash";

@Injectable()
export class ProfileIntegrationAdapter {

    async adaptiveResponseDataProfile({ towns }: IProfileApiResponse): Promise<IAdaptiveProfile[]> {
        return map(towns, ({ city, city_id, addresses }) => {
            return this.addressDestruction(addresses, city, city_id);
        })
            .flat();
    };

    private addressDestruction(address: Address[], city: string, city_id: string): IAdaptiveProfile[] {
        return map(address, ({ address, addressId }) => ({ address, addressId, city, city_id }));
    };
}