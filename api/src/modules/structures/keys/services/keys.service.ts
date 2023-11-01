import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { FilterQuery, PopulateOptions, Types, UpdateQuery } from 'mongoose';
import { KeysRepository } from '../repositories';
import { Average, AverageService } from '../../average';
import { ArticleDocument } from '../../article';
import { StatisticsUpdateRMQ } from 'src/modules/rabbitmq/contracts/statistics';
import { QueueProvider } from 'src/modules/lib/queue';
import { KeysDocument } from '../schemas';
import { User } from 'src/modules/auth';
import { InspectorKeywords } from './inspectors/inspector-keywords.inspector';
import { KeyBuilder } from './builders';
import { ERROR_KEYWORD_UPDATE } from '../constants';
import { UpdateKeywordService } from './updates';

@Injectable()
export class KeysService {
  protected readonly logger = new Logger(KeysService.name);

  constructor(
    private readonly keysRepository: KeysRepository,
    private readonly keyBuilder: KeyBuilder,
    private readonly inspectorKeywords: InspectorKeywords,
    private readonly updateKeywordService: UpdateKeywordService,
    private readonly queueProvider: QueueProvider,
    private readonly averageService: AverageService,
  ) { }

  async count(searchQuery: FilterQuery<KeysDocument>) {
    return await this.keysRepository.getCountDocuments(searchQuery);
  }

  async getOne(filterQuery: FilterQuery<KeysDocument>) {
    return await this.keysRepository.findOne(filterQuery);
  }

  async inspectKeywords(userId: User, keywords: string[], article: string) {
    const currentKeyword = this.keysRepository.find({ userId, article });
    const currentNotActiveKeyword = this.keysRepository.find({ userId, article, active: false });

    const [currentAll, notActive] = await Promise.all([currentKeyword, currentNotActiveKeyword]);

    const getActive = this.inspectorKeywords.inspect(currentAll, keywords);
    const getNotActive = this.inspectorKeywords.inspectNot(notActive, keywords);

    const result = await Promise.all([getActive, getNotActive]);

    return result;
  }

  async find(searchQuery: FilterQuery<ArticleDocument>, populate?: PopulateOptions | (string | PopulateOptions)[]) {
    return await this.keysRepository.find(searchQuery, populate);
  }

  async updateMany(ids: Array<Types.ObjectId>, updateQuery: UpdateQuery<unknown>) {
    return await this.keysRepository.updateMany({ _id: ids }, updateQuery);
  }

  //Обновление срденего для ключа и подсчет разницы
  async updateAverage(payload: {
    id: Types.ObjectId;
    average: { cpm: number; promotion: number; promoPosition: number; position: number };
    key_id: Types.ObjectId;
  }) {
    await this.averageService.update(payload);
    const key = await this.keysRepository.findOne(
      { _id: payload.key_id },
      { path: 'average', select: 'average', model: Average.name },
    );
    const average = [key.average.at(-1), key.average.at(-2)].includes(undefined)
      ? []
      : [key.average.at(-1), key.average.at(-2)];

    if (average.length > 0) await this.averageService.updateDiff(average);
  }

  async refreshKeyword(_id: Types.ObjectId) {
    return this.keysRepository.findOne({ _id }).then(keyword => {
      if (!keyword) throw new BadRequestException(ERROR_KEYWORD_UPDATE);

      return this.keyBuilder.getFrequency(keyword.key).initialUpdateData(keyword).getDocument(_id);
    });
  }

  async updateData(payload: StatisticsUpdateRMQ.Payload) {
    new Promise(resolve => {
      if (payload.position.position >= 0) {
        payload.position.position = payload.position.position + 1; // Исправить в парсере и убрать
      }

      const document = this.keysRepository.findOne({ _id: payload.key_id });
      const promiseData: Promise<StatisticsUpdateRMQ.Payload> = new Promise(resolve =>
        resolve(payload),
      );
      resolve(
        this.queueProvider.pushTask(async () => {
          (() =>
            this.updateKeywordService
              .setDocument(document)
              .setDataUpdate(promiseData)
              .updateCurrentDate(promiseData)
              .updateCurrentAverage(promiseData)
              .getCheckUpdate())();
        }),
      );
    });
  }

  async keySubscriptionManagement(userId: number, update: boolean) {
    return await this.keysRepository.updateMany({ userId }, { active_sub: update });
  }

  async refreshAllKeysFromArticle(article: string, user: User) {
    await this.keysRefreshService.refreshKeysInArticle(article, user);
  }

}
