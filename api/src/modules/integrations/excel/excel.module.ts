import { Module } from "@nestjs/common";
import { ExcelProvider } from "./providers/excel.provider";
import { ArticleModule } from "src/modules/structures/article";
import { RmqModule } from "src/modules/rabbitmq/rabbitmq.module";
import { RmqExchanges } from "src/modules/rabbitmq/exchanges";


@Module({
    imports: [ArticleModule, RmqModule.register({ exchanges: [RmqExchanges.STATISTICS] }),],
    providers: [ExcelProvider]
})
export class ExcelIntegrationModule { }