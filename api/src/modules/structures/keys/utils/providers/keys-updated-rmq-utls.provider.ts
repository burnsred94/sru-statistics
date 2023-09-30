import { Injectable } from "@nestjs/common";
import { AverageService } from "src/modules/structures/average";
import { PvzService } from "src/modules/structures/pvz";
import { Types } from "mongoose";
import { IPvzRMQSendStructure } from "../../types";
import { concatMap, from } from "rxjs";


@Injectable()
export class KeysUpdatedRMQUtils {

    constructor(
        private readonly averageService: AverageService,
        private readonly pvzService: PvzService
    ) { }

    public async refreshKeyDataInDB(data: IPvzRMQSendStructure[], average: Types.ObjectId): Promise<void> {
        from(data)
            .pipe(concatMap(async (element) => {
                await this.refreshPositionInDB(element.addressId);
                return true;
            }))
            .subscribe({
                complete: () => {
                    this.averageService.updateRefresh(average)
                }
            })
    }

    private async refreshPositionInDB(pvz_id: Types.ObjectId) {
        await this.pvzService.periodRefresh(pvz_id);
    }
}