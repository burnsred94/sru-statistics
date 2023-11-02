import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { KeysRepository } from '../../repositories';
import { HydratedDocument } from 'mongoose';
import { Keys } from '../../schemas';
import { AverageService } from 'src/modules/structures/average';
import { PvzService } from 'src/modules/structures/pvz';
import { StatisticsUpdateRMQ } from 'src/modules/rabbitmq/contracts/statistics';
import { KEYWORDS_METRIC_UPDATE } from '../../constants';

@Injectable()
export class UpdateKeywordService {
  protected readonly logger = new Logger(UpdateKeywordService.name);

  document: Promise<HydratedDocument<Keys>>;
  dataUpdated: Promise<StatisticsUpdateRMQ.Payload>;
  private checkUpdateCurrentDate: Promise<boolean>;
  private checkUpdateCurrentAverage: Promise<boolean>;

  constructor(
    private readonly keywordsRepository: KeysRepository,
    private readonly averageService: AverageService,
    private readonly addressService: PvzService,
  ) { }

  setDocument(document: Promise<HydratedDocument<Keys>>) {
    this.document = document;
    return this;
  }

  setDataUpdate(dataUpdate: Promise<StatisticsUpdateRMQ.Payload>) {
    this.dataUpdated = dataUpdate;
    return this;
  }

  updateCurrentDate(dataUpdated: Promise<StatisticsUpdateRMQ.Payload>) {
    Promise.all([this.document, dataUpdated])
      .then(([document, data]) => {
        if (!document) throw new BadRequestException(`Не передан документ`);
        this.checkUpdateCurrentDate = this.addressService.update(data);
      })
      .catch(error => {
        this.logger.error(error.message);
      });
    return this;
  }

  updateCurrentAverage(dataUpdated: Promise<StatisticsUpdateRMQ.Payload>) {
    Promise.all([this.updateCurrentDate, dataUpdated])
      .then(([check, data]) => {
        if (!check) throw new BadRequestException('Не обновлены данные в позиции');
        this.averageService.update({
          id: data.averageId,
          average: data.position,
          key_id: data.key_id,
        });

        this.checkUpdateCurrentAverage = Promise.resolve(true);
        return data
      }).then((update) => {
        if (update) {
          this.keywordsRepository.findOne({ _id: update.key_id }, KEYWORDS_METRIC_UPDATE)
            .then((data) => {
              this.averageService.updateDiff([data.average.at(-1), data.average.at(-2)]);
            })
        }
      })
      .catch(error => {
        this.logger.error(error.message);
      });
    return this;
  }

  async getCheckUpdate() {
    const [checkAverage, checkDate] = await Promise.all([
      this.checkUpdateCurrentAverage,
      this.checkUpdateCurrentAverage,
    ]);
    if (checkAverage && checkDate) {
      return true;
    }
  }
}
