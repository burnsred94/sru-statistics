import { Injectable } from "@nestjs/common";
import { KeysPullRmqUtilsProvider, KeysUpdatedRMQUtils } from "./providers";
import { KeysDocument } from "../schemas";
import { IFacadeUtils, IPullIdsResponse, IPvzRMQSendStructure } from "../types";
import { Types } from "mongoose";


@Injectable()
export class KeysUtilsFacade implements IFacadeUtils {

    constructor(
        private readonly keysPullRmqUtilsProvider: KeysPullRmqUtilsProvider,
        private readonly keysUpdatedRMQUtils: KeysUpdatedRMQUtils,
    ) { }

    public async pullIdsToSendRMQ(document: KeysDocument): Promise<IPullIdsResponse> {
        return await this.keysPullRmqUtilsProvider.pullIds(document);
    }

    public async refreshKeyDataInDB(data: IPvzRMQSendStructure[], average: Types.ObjectId) {
        return await this.keysUpdatedRMQUtils.refreshKeyDataInDB(data, average);
    }
}