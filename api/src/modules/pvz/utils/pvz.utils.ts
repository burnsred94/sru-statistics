import { Injectable } from "@nestjs/common";



@Injectable()
export class PvzUtils {

    async calculateAverage(data: any[]) {
        const average = data.reduce((accumulator, item) => {
            console.log(item);
        }, 0)

        return average
    }
}