import { Module } from "@nestjs/common";
import { UpdateModule } from "./update";
import { ScheduleModule } from './schedule/schedule.module';


@Module({
    imports: [UpdateModule, ScheduleModule],
})
export class CoreModule { }