import { Module } from '@nestjs/common';
import { MathUtils, PaginationUtils } from './providers';

@Module({
  imports: [],
  providers: [MathUtils, PaginationUtils],
  exports: [MathUtils, PaginationUtils],
})
export class UtilsModule {}
