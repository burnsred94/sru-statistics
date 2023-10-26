import { Module } from "@nestjs/common";
import { KeywordsContextService } from "./keywords-context.service";
import { STRATEGY_REFRESH } from "./types";
import { KeywordsDataContextStrategy } from "./strategies";
import { ParserIntegrationModule } from "src/modules/integrations/parser/parser-integration.module";
import { QueueModule } from "src/modules/lib/queue";


@Module({
    imports: [ParserIntegrationModule, QueueModule],
    providers: [
        {
            provide: STRATEGY_REFRESH.KEYWORDS_DATA_REFRESH,
            useClass: KeywordsDataContextStrategy
        },
        {
            provide: STRATEGY_REFRESH.KEYWORDS_NIGHT_REFRESH,
            useClass: KeywordsDataContextStrategy
        },
        KeywordsContextService,
    ],
    exports: [KeywordsContextService]
})
export class KeywordContextModule {

}