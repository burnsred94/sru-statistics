import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GotModule } from '@t00nday/nestjs-got';
import { FetchSearchProvider, FetchProvider } from './provider';
import { KeysModule } from '../keys';
import { FetchUtils } from './utils';

@Module({
  providers: [FetchSearchProvider, FetchProvider, FetchUtils],
  imports: [ConfigModule, GotModule, KeysModule],
  exports: [FetchSearchProvider, FetchProvider],
})
export class FetchModule {}
