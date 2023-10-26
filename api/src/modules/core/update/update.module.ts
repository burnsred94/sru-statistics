import { Module } from "@nestjs/common";
import { KeywordContextModule } from "./keywords-context/keywords-context.module";
import { KeywordRefreshModule } from "./keywords-refresh/keywords-refresh.module";

@Module({
    imports: [KeywordContextModule, KeywordRefreshModule],
})
export class UpdateModule { }