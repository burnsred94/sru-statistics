import { Module } from '@nestjs/common';
import { PaginationRepository } from './repositories/pagination.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Pagination, PaginationSchema } from './schemas';
import { PaginationService } from './pagination.service';
import { PaginationController } from './pagination.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Pagination.name, schema: PaginationSchema }])],
  providers: [PaginationRepository, PaginationService],
  controllers: [PaginationController],
  exports: [PaginationService],
})
export class PaginationModule {}
