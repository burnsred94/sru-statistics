import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Keys, KeysSchema } from './schemas';
import { KeysRepository } from './repositories';
import { KeysService } from './services';
import { PvzModule } from '../pvz';
import { AverageModule } from '../average';
import { MockGenerator } from './utils';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Keys.name, schema: KeysSchema }]),
    PvzModule,
    AverageModule,
  ],
  providers: [KeysRepository, KeysService, MockGenerator],
  exports: [KeysService, MockGenerator],
})
export class KeysModule {}
