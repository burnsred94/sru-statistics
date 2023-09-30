import { Types } from "mongoose";
import { KeysDocument } from "../../../schemas";
import { IPullIdsResponse, IPvzRMQSendStructure } from "../../interfaces";

export interface IFacadeUtils {
    pullIdsToSendRMQ(document: KeysDocument): Promise<IPullIdsResponse>;
    refreshKeyDataInDB(data: IPvzRMQSendStructure[], average: Types.ObjectId): Promise<void>;
}