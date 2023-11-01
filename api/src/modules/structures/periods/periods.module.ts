import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Periods, PeriodSchema } from './schemas';
import { PeriodsService } from './services/periods.service';
import { PeriodsRepository } from './repositories';

@Module({
  imports: [MongooseModule.forFeature([{ name: Periods.name, schema: PeriodSchema }])],
  providers: [PeriodsService, PeriodsRepository],
  exports: [PeriodsService],
})
export class PeriodsModule {}
