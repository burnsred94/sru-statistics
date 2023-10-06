import { Module } from '@nestjs/common';
import { FoldersController } from './controllers/folders.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Folder, FolderSchema } from './schemas';
import { FolderRepository } from './repositories';
import { FolderService } from './services';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Folder.name, schema: FolderSchema }])
  ],
  controllers: [FoldersController],
  providers: [FolderService, FolderRepository]
})
export class FoldersModule { }
