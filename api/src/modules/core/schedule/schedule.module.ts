import { Module } from '@nestjs/common';
import { RefreshNightKeywords } from './services/refresh-night-keywords.service';
import { KeywordContextModule } from '../update/keywords-context/keywords-context.module';
import { KeywordRefreshModule } from '../update/keywords-refresh/keywords-refresh.module';

const KEYWORDS_PROVIDERS = [RefreshNightKeywords];

@Module({
    providers: [...KEYWORDS_PROVIDERS],
    imports: [ScheduleModule, KeywordContextModule, KeywordRefreshModule],
})
export class ScheduleModule { }
