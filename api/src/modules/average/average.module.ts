import { Module } from '@nestjs/common';
import { AverageService } from './services';
import { MongooseModule } from '@nestjs/mongoose';
import { Average, AverageSchema } from './schemas';
import { AverageRepository } from './repositories';
import { AverageController } from './average.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Average.name, schema: AverageSchema }])],
  providers: [AverageService, AverageRepository],
  controllers: [AverageController],
  exports: [AverageService],
})
export class AverageModule { }
