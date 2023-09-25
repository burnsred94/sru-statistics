import { Module } from '@nestjs/common';
import { MathUtils } from './providers';

@Module({
  imports: [],
  providers: [MathUtils],
  exports: [MathUtils],
})
export class UtilsModule { }
