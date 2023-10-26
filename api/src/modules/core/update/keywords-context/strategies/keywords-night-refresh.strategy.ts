import { Injectable } from "@nestjs/common";
import { QueueProvider } from "src/modules/lib/queue";
import { ParserIntegrationService } from "src/modules/integrations/parser/services/parser-integration.service";
import { HydratedDocument } from "mongoose";
import { Keys } from "src/modules/structures/keys";
import { chunk, forEach } from "lodash";
import { from, tap } from "rxjs";
import { IKeywordsContext } from "../keywords-context.service";


@Injectable()
export class KeywordsNightRefresh implements IKeywordsContext {

    constructor(
        private readonly queueProvider: QueueProvider,
        private readonly parserIntegrationService: ParserIntegrationService
    ) { }

    sendToQueue(keyword: HydratedDocument<Keys>[]): void {

        const keyword_chunk = chunk(keyword, 500)

        new Promise(() => {
            forEach(keyword_chunk, (element) => {
                from(element)
                    .pipe(
                        tap((value) => this.queueProvider.pushTask(async () => await this.parserIntegrationService.sendToQueue(value)))
                    )
            })
        })
    }

}