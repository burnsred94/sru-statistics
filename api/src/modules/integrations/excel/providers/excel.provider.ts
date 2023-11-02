import { Injectable } from "@nestjs/common";
import { Payload } from "@nestjs/microservices";
import { StatisticsGetArticlesRMQ } from "src/modules/rabbitmq/contracts/statistics";
import { RabbitMqResponser } from "src/modules/rabbitmq/decorators";
import { RmqExchanges, RmqServices } from "src/modules/rabbitmq/exchanges";
import { ArticleRepository } from "src/modules/structures/article";
import { ARTICLE_POPULATE_METRIC } from "src/modules/structures/article/constants/populate";


@Injectable()
export class ExcelProvider {

    constructor(private readonly articleRepository: ArticleRepository) { }

    @RabbitMqResponser({
        exchange: RmqExchanges.STATISTICS,
        routingKey: StatisticsGetArticlesRMQ.routingKey,
        queue: StatisticsGetArticlesRMQ.queue,
        currentService: RmqServices.STATISTICS,
    })
    async getArticles(@Payload() payload: StatisticsGetArticlesRMQ.Payload) {
        const articles = await this.articleRepository.find(
            { _id: payload.articles, userId: payload.userId },
            ARTICLE_POPULATE_METRIC,
        );

        return { articles }
    }
}