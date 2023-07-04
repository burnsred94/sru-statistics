import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Periods, PeriodSchema } from './schemas';
import { PeriodsService } from './services/periods.service';
import { PeriodsRepository } from './repositories';
import { PvzModule } from '../pvz';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Periods.name, schema: PeriodSchema }]),
    forwardRef(() => PvzModule),
  ],
  providers: [PeriodsService, PeriodsRepository],
  exports: [PeriodsService],
})
export class PeriodsModule { }
