import { Injectable } from "@nestjs/common";
import { QueueProvider } from "src/modules/lib/queue";
import { ParserIntegrationService } from "src/modules/integrations/parser/services/parser-integration.service";
import { HydratedDocument } from "mongoose";
import { Keys } from "src/modules/structures/keys";
import { IKeywordsContext } from "../keywords-context.service";

@Injectable()
export class KeywordsDataContextStrategy implements IKeywordsContext {

    constructor(
        private readonly queueProvider: QueueProvider,
        private readonly parserIntegrationService: ParserIntegrationService
    ) { }

    sendToQueue(keyword: HydratedDocument<Keys>): void {
        this.queueProvider.pushTask(async () => await this.parserIntegrationService.sendToQueue(keyword));
    }

}