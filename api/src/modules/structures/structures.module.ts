import { Module } from '@nestjs/common';
import { ArticleModule } from './article';
import { KeysModule } from './keys';
import { PvzModule } from './pvz';
import { AverageModule } from './average';
import { PeriodsModule } from './periods';
import { MetricsModule } from './metrics/metrics.module';

const StructuresModules = [
    ArticleModule,
    KeysModule,
    PvzModule,
    AverageModule,
    PeriodsModule,
    MetricsModule
]

@Module({
    imports: [...StructuresModules]
})
export class StructuresModule { }
