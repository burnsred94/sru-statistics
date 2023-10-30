import { Module } from '@nestjs/common';
import { KeywordContextModule } from './keywords-context/keywords-context.module';
import { KeywordRefreshModule } from './keywords-refresh/keywords-refresh.module';
import { MetricsRefreshModule } from './metrics-refresh/metrics-refresh.module';

@Module({
  imports: [KeywordContextModule, KeywordRefreshModule, MetricsRefreshModule],
})
export class UpdateModule {}
