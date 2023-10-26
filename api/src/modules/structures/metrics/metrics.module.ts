import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Metrics, MetricsSchema } from './schemas';
import { MetricsController } from './metrics.controller';
import { MetricsRepository } from './repositories';
import { MetricsService } from './services/metrics.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Metrics.name, schema: MetricsSchema }]),
  ],
  providers: [MetricsRepository, MetricsService],
  exports: [MetricsService],
  controllers: [MetricsController],
})
export class MetricsModule { }
