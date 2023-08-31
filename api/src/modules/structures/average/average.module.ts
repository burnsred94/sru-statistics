import { Module } from '@nestjs/common';
import { AverageService } from './services';
import { MongooseModule } from '@nestjs/mongoose';
import { Average, AverageSchema } from './schemas';
import { AverageRepository } from './repositories';
import { UtilsModule } from '../../utils';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Average.name, schema: AverageSchema }]),
    UtilsModule,
  ],
  providers: [AverageService, AverageRepository],
  exports: [AverageService],
})
export class AverageModule { }
