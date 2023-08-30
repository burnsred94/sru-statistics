import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Metrics, MetricsSchema } from './schemas';
import { MetricsController } from './metrics.controller';
import { MetricsRepository } from './repositories';
import { MetricsService } from './metrics.service';
import { KeysModule } from '../keys';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Metrics.name, schema: MetricsSchema }]),
        KeysModule
    ],
    providers: [MetricsRepository, MetricsService],
    controllers: [MetricsController],
})
export class MetricsModule { }
