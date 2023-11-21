import { Injectable, Logger } from '@nestjs/common';
import { MetricsRepository } from '../repositories';
import { User } from 'src/modules/auth';
import { Types } from 'mongoose';
import { MetricDefault, MetricEntity } from '../entities';
import { IMetricData } from '../types';
import { IMetric } from '../../article/types/interfaces';
import { GetMetricsDto } from '../dto/metrics.dto';
//"0 9-23/3 * * *"

// export interface PayloadMetric {
//     _id: Types.ObjectId;
//     user: User;
// }

@Injectable()
export class MetricsService {
  protected readonly logger = new Logger(MetricsService.name);

  constructor(private readonly metricsRepository: MetricsRepository) { }

  async getMetrics(user: User, _id: Types.ObjectId, dto?: GetMetricsDto) {
    const id = new Types.ObjectId(_id);
    const metrics = await this.metricsRepository.findOne({ $or: [{ article: id }, { folder: id }] });

    if (dto.period) {
      return {
        _id: metrics._id,
        top_100: {
          num: metrics.top_100.at(-1).met,
          data: metrics.top_100.filter((value) => dto.period.includes(value.ts)),
        },
        top_1000: {
          num: metrics.top_1000.at(-1).met,
          data: metrics.top_1000.filter((value) => dto.period.includes(value.ts)),
        },
        indexes: {
          num: metrics.indexes.at(-1).met,
          data: metrics.indexes.filter((value) => dto.period.includes(value.ts)),
        },
        middle_pos_organic: {
          num: metrics.middle_pos_organic.at(-1).met,
          data: metrics.middle_pos_organic.filter((value) => dto.period.includes(value.ts)),
        },
        middle_pos_adverts: {
          num: metrics.middle_pos_adverts.at(-1).met,
          data: metrics.middle_pos_adverts.filter((value) => dto.period.includes(value.ts)),
        },
        middle_pos_cities: metrics.middle_pos_cities,
      };
    }
  }

  async updateMetric(data: IMetric) {
    const metric = await this.metricsRepository.findOne({ article: data.article, user: data.user })
    new MetricEntity().initMetric(data, metric)
      .then((metric) => {
        this.metricsRepository.findOneAndUpdate({ article: data.article, user: data.user }, metric);
      })
  }

  async updateMetricFolder(data: { folder: Types.ObjectId, metric: IMetric }, user: User) {
    const metric = await this.metricsRepository.findOne({ folder: data.folder, user })
    new MetricEntity().initMetric(data.metric, metric)
      .then((metric) => {
        this.metricsRepository.findOneAndUpdate({ folder: data.folder, user }, metric);
      })
  }

  async create(data: IMetricData): Promise<Types.ObjectId> {
    const metricDefault = new MetricDefault(data).createDefault();
    const metric = await this.metricsRepository.create(metricDefault);
    return metric._id;
  }

}
