import { Injectable, Logger } from "@nestjs/common";
import { chunk } from "lodash";
import { IPaginationResponse } from "../types";


@Injectable()
export class PaginationUtils {

    protected readonly logger = new Logger(PaginationUtils.name);

    public async paginate<T>(pagination: { limit: number, page: number }, data: T[], name: string): Promise<IPaginationResponse> {
        try {
            const total_elements = data.length;

            let element: unknown[],
                page: number,
                total: number,
                page_size: number;

            const chunks = chunk(data, pagination.limit);

            if (chunks[pagination.page - 1]) {
                element = chunks[pagination.page - 1],
                    page = pagination.page,
                    total = chunks.length,
                    page_size = pagination.limit;
            } else {
                element = chunks[0],
                    page = 1,
                    total = chunks.length,
                    page_size = pagination.limit;
            }

            return {
                [name]: element ?? [],
                meta: {
                    page, total, page_size,
                },
                count: total_elements,
            }

        } catch (error) {
            this.logger.error(error.message);
            // TODO: Обработать исключение
        }
    }
}