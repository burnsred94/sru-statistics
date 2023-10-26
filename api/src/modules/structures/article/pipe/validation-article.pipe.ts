import { HttpService } from "@nestjs/axios";
import { BadRequestException, Injectable, Logger, PipeTransform } from "@nestjs/common";
import { firstValueFrom } from "rxjs";
import { CreateArticleDto } from "../dto";
import { DEFAULT_ERROR_PRODUCT_NAME, DEFAULT_WILDBERRIES_ERROR_SERVER } from "../constants";


@Injectable()
export class ValidationArticlePipe implements PipeTransform {
    protected readonly logger = new Logger();
    httpService: HttpService;

    constructor() {
        this.httpService = new HttpService();
    }

    transform(value: CreateArticleDto) {
        const { article } = value;
        const response = firstValueFrom(this.httpService.get(`https://card.wb.ru/cards/v1/detail?nm=${article}`))

        response
            .catch(((error) => {
                this.logger.error(error.message);
                throw new BadRequestException(`${DEFAULT_WILDBERRIES_ERROR_SERVER}`)
            }))

        return response
            .then(({ data }) => {
                if (data.data.products.length === 0) {
                    throw new BadRequestException(`${DEFAULT_ERROR_PRODUCT_NAME} ${article}`)
                } else {
                    return value;
                }
            })


    }

}