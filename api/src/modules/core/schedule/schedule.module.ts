import { Module } from '@nestjs/common';
import { RefreshNightKeywords } from './services';
import { KeywordContextModule } from '../update/keywords-context/keywords-context.module';
import { KeywordRefreshModule } from '../update/keywords-refresh/keywords-refresh.module';
import { MetricsUpdatedService } from './services'
import { MetricsRefreshModule } from '../update/metrics-refresh';

const KEYWORDS_PROVIDERS = [RefreshNightKeywords, MetricsUpdatedService];

@Module({
  providers: [...KEYWORDS_PROVIDERS],
  imports: [ScheduleModule, KeywordContextModule, KeywordRefreshModule, MetricsRefreshModule],
})
export class ScheduleModule { }
