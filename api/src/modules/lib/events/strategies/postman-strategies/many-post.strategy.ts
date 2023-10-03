import { IEventPostman, StrategyEventSender } from "../../types/interfaces";

export interface ICalculatorResponse {
    intervale: number,
    second: number,
    fullTicksTime: number,
}


export class ManyPostStrategy implements StrategyEventSender {
    per_second = 1000;
    limit = 1000
    per_minute = 60


    public eventSender(data: IEventPostman, callback: () => Promise<boolean>): void {
        const calculate_result = this.calculate(data.count);

        setImmediate(() => {
            this.runnerSend(calculate_result, callback)
        })
    }

    private calculate(count: number) {
        const getCoefficientTime = this.getCoefficientTime(count);
        const intervale = ((this.per_second * getCoefficientTime) * 60);
        const fullTicksTime = this.getFullTicksTime(count, intervale);
        return {
            intervale,
            second: this.per_second,
            fullTicksTime
        }
    }

    private getCoefficientTime(count: number) {
        let result = 0;
        result = count / this.limit;
        return result;
    }


    private getFullTicksTime(count: number, intervale: number): number {
        const init = this.per_second + intervale;
        let accumulator = init;

        for (let tick = 0; tick <= count; tick++) {
            accumulator += init + tick

            if (tick === count) {
                return accumulator
            }
        }
    }

    private async runnerSend(data: ICalculatorResponse, callback: () => Promise<boolean>, history?) {
        console.log(data, history);

        let init = 0
        let accumulator = 0;
        let fail = 0

        if (history) {
            init = history.init;
            accumulator = history.accumulator + init;
            fail = history.fail
        } else {
            init = this.per_second + data.intervale;
            accumulator = init;
            fail = 0
        }

        const timeout_id = setTimeout(() => {

            callback()
                .then((result) => {
                    if ((data.fullTicksTime * 2) < accumulator) {
                        console.log(`end`);
                        clearTimeout(timeout_id)
                        return
                    }

                    if (result) {
                        accumulator += init + data.intervale;
                        setImmediate(() => {
                            this.runnerSend(data, callback, { init, accumulator, fail: 0 })
                        })
                    } else {
                        accumulator += init + data.intervale;
                        fail++;

                        if (fail <= 3) {
                            setImmediate(() => {
                                this.runnerSend(data, callback, { init, accumulator, fail: fail })
                            })
                        } else {
                            clearTimeout(timeout_id);
                        }
                    }
                })

        }, accumulator);
    }
}
