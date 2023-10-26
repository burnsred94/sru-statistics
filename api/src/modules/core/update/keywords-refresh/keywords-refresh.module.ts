import { Module } from "@nestjs/common";
import { KeywordRefreshService } from "./services/keyword.refresh.service";
import { KeysModule } from "src/modules/structures/keys";

@Module({
    imports: [KeysModule],
    providers: [KeywordRefreshService],
    exports: [KeywordRefreshService]
})
export class KeywordRefreshModule { }