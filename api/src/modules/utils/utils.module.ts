import { Module } from '@nestjs/common';
import { MathUtils } from './providers';

@Module({
    providers: [MathUtils],
    exports: [MathUtils]
})
export class UtilsModule { }
