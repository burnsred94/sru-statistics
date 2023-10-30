import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MetricsRefreshService } from '../../update/metrics-refresh/services';

//"0 9-23/1 * * *"

@Injectable()
export class MetricsUpdatedService {

  constructor(private readonly metricRefreshService: MetricsRefreshService) { }

  @Cron("0 9-23/1 * * *", { timeZone: "Europe/Moscow" })
  async taskUpdateMetrics() {
    new Promise((resolve) => resolve(this.metricRefreshService.taskMetricArticleUpdate()))
    new Promise((resolve) => resolve(this.metricRefreshService.taskMetricsFolderUpdate()))
  }
}

