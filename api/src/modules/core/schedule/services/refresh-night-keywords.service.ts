import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { KeywordRefreshService } from '../../update/keywords-refresh/services/keyword.refresh.service';

@Injectable()
export class RefreshNightKeywords {
  constructor(private readonly keywordRefreshService: KeywordRefreshService) { }

  @Cron('0 17 * * *', { timeZone: 'Europe/Moscow' })
  async taskKeywordsNightUpdate() {
    this.keywordRefreshService.updateNight()
  }


}
