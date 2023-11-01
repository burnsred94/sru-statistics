import { Module } from '@nestjs/common';
import { FoldersController } from './controllers/folders.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Folder, FolderSchema } from './schemas';
import { FolderRepository } from './repositories';
import { FolderService } from './services';
import { UtilsModule } from 'src/modules/utils';
import { KeysModule } from '../keys';
import { MetricsModule } from '../metrics/metrics.module';
import { FolderMetricsService } from './services/metrics';
import { ArticleModule } from '../article';

const PROVIDERS = [FolderMetricsService, FolderService]

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Folder.name, schema: FolderSchema }]),
    UtilsModule,
    ArticleModule,
    MetricsModule,
    KeysModule,
  ],
  controllers: [FoldersController],
  providers: [...PROVIDERS, FolderRepository],
  exports: [...PROVIDERS]
})
export class FoldersModule { }
