import { Module } from '@nestjs/common';
import { FoldersController } from './controllers/folders.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Folder, FolderSchema } from './schemas';
import { FolderRepository } from './repositories';
import { FolderService } from './services';
import { UtilsModule } from 'src/modules/utils';
import { KeysModule } from '../keys';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Folder.name, schema: FolderSchema }]),
    UtilsModule,
    KeysModule
  ],
  controllers: [FoldersController],
  providers: [FolderService, FolderRepository],
})
export class FoldersModule { }
