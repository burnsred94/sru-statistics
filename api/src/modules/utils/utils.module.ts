import { Module } from '@nestjs/common';
import { MathUtils, MetricMathUtils, PaginationUtils } from './providers';

@Module({
  imports: [],
  providers: [MathUtils, PaginationUtils, MetricMathUtils],
  exports: [MathUtils, PaginationUtils, MetricMathUtils],
})
export class UtilsModule { }
