import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Pvz, PvzSchema } from './schemas';
import { PvzService } from './services';
import { PvzRepository } from './repositories';
import { PeriodsModule } from '../periods';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Pvz.name, schema: PvzSchema }]),
    PeriodsModule,
  ],
  providers: [PvzService, PvzRepository],
  exports: [PvzService],
})
export class PvzModule {}
