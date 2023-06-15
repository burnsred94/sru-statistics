import { Module } from '@nestjs/common';
import { FetchProductProvider } from './provider/fetch-product.provider';
import { ConfigModule } from '@nestjs/config';
import { GotModule } from '@t00nday/nestjs-got';
import { FetchSearchProvider } from './provider/fetch-search.provider';

@Module({
  providers: [FetchProductProvider, FetchSearchProvider],
  imports: [ConfigModule, GotModule],
  exports: [FetchProductProvider, FetchSearchProvider],
})
export class FetchModule {}
