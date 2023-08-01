import { Controller, Get } from "@nestjs/common";
import { AverageRepository } from "./repositories";
import { forEach } from "lodash";


@Controller('/average-repositories')
export class AverageController {
    constructor(private readonly averageRepo: AverageRepository) { }

    @Get('average')
    async getAverage() {
        const find = await this.averageRepo.find()
        forEach(find, async value => {
            await this.averageRepo.updateTime(value._id, '01.08.2023')
        })
    }
}