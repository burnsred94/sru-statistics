import { Injectable, Logger } from '@nestjs/common';
import { FolderRepository } from '../repositories';
import {
  AddManyFolderDto,
  CreateFolderDto,
  GetListDto,
  RemoveFolderDto,
  RemovedKeysInFolderDto,
  AddNewKeysToFolderDto
} from '../dto';
import { User } from 'src/modules/auth';
import { FolderDocument } from '../schemas';
import { POPULATE_KEYS_REFRESH, keysPopulateAndQuery } from '../constants';
import { FilterQuery, HydratedDocument, PopulateOptions, Types, UpdateQuery } from 'mongoose';
import { PaginationUtils } from 'src/modules/utils/providers';
import { IPaginationResponse } from 'src/modules/utils/types';
import { IManyFolderResponse } from '../types';
import { reduce } from 'lodash';
import { MetricsService } from '../../metrics/services';
import { FolderMetricsService } from './metrics';
import { IMetric } from '../../article/types/interfaces';
import { KeyBuilder, Keys, KeysService } from '../../keys';


@Injectable()
export class FolderService {
  protected readonly logger = new Logger(FolderService.name);

  constructor(
    private readonly folderRepository: FolderRepository,
    private readonly paginationUtils: PaginationUtils,
    private readonly keysService: KeysService,
    private readonly keyBuilder: KeyBuilder,
    private readonly folderMetricService: FolderMetricsService,
    private readonly metricService: MetricsService
  ) { }

  async create(dto: CreateFolderDto, user: User): Promise<FolderDocument> {
    console.log('c')
    const folder = await this.folderRepository.create({ user: user, ...dto });
    this.initMetricKeywords(folder, dto.keys, dto.article_id);
    return folder
  }

  async createDuplicate(dto: CreateFolderDto, user: User): Promise<FolderDocument> {
    let count = 0;
    let find = false;

    while (!find) {
      const modified_name =
        count > 0 ? dto.name + ` (дубликат ${count})` : dto.name + ` (дубликат)`;

      const findName = await this.folderRepository.findOne({
        user,
        article_id: dto.article_id,
        name: modified_name,
      });

      if (findName) {
        count++;
      } else {
        find = true;
        const result = await this.folderRepository.create({ user: user, ...dto, name: modified_name });
        this.initMetricKeywords(result, dto.keys, dto.article_id);
        return result
      }
    }
  }

  async findAll(
    user: User,
    article: Types.ObjectId,
    dto: GetListDto,
    query?: { search: string },
  ): Promise<IManyFolderResponse | { folders: HydratedDocument<FolderDocument>[] }> {
    const data = await this.folderRepository.findList(user, article, query);

    if (dto.list) {
      const pagination_data = await this.paginationUtils.paginate(dto.pagination, data, 'folders');

      const count_keys = reduce(
        data,
        (accumulator, element) => {
          const count = element.keys;
          return accumulator + count;
        },
        0,
      );

      return {
        count_keys,
        ...pagination_data,
      };
    } else {
      return {
        folders: data,
      };
    }
  }

  async findOne(
    filterQuery: FilterQuery<FolderDocument>,
    sortQuery?,
  ): Promise<{ metric: any, folder: IPaginationResponse } | { metric: any, folder: HydratedDocument<FolderDocument> }> {
    let populate: PopulateOptions | (string | PopulateOptions)[];
    let metric;

    if (sortQuery) {
      populate = await keysPopulateAndQuery(sortQuery);
    } else {
      const folder = await this.folderRepository.findOne(filterQuery);
      if (folder) {
        metric = await this.metricService.getMetrics(filterQuery.user, folder?._id);
      }

      return {
        metric,
        folder
      }
    }

    const pagination = sortQuery.pagination;

    const data = await this.folderRepository.findOne(filterQuery, populate);

    const response = await this.paginationUtils.paginate(pagination, data.keys, 'keys');
    metric = await this.metricService.getMetrics(filterQuery.user, data._id);
    return {
      metric,
      folder: response
    }
  }

  async addedManyFolderKeys(dto: AddManyFolderDto, user: User) {
    const { ids_folders, ids_keys } = dto;
    return await this.folderRepository.updateMany(
      { _id: ids_folders, user },
      { $addToSet: { keys: ids_keys } },
    );
  }

  async removedManyKeys(dto: RemovedKeysInFolderDto, user: User) {
    return await this.folderRepository.findOneAndUpdate(
      { _id: dto.id_folder, user: user },
      { $pull: { keys: { $in: dto.ids_keys } } },
    );
  }

  async refreshFolder(id: Types.ObjectId, user: User) {
    const { keys, name } = await this.folderRepository.findOne({ _id: id, user }, POPULATE_KEYS_REFRESH)
    const data = keys as unknown as HydratedDocument<Keys>[];

    if (data) {
      data.map((element) => {
        this.keyBuilder
          .getFrequency(element.key)
          .initialUpdateData(element)
      });
    }
    return { message: `Ключи в папке "${name}" обновляются. Это займет некоторое время` }
  }

  async removeFolder(dto: RemoveFolderDto, user: User): Promise<boolean> {
    return await this.folderRepository.deleteMany({ _id: dto._id, user: user });
  }

  async update(updateQuery: UpdateQuery<FolderDocument>) {
    return await this.folderRepository.findOneAndUpdate({ _id: updateQuery._id }, updateQuery);
  }

  async addedNewKeywords(dto: AddNewKeysToFolderDto, user: User, id: Types.ObjectId, article: string) {
    dto.keys.forEach(async (key) => {
      const getKeyId = await this.keysService.getOne({ article, key, userId: user })
      if (getKeyId) {
        this.folderRepository.findOneAndUpdate({ _id: id }, { $push: { keys: getKeyId._id } });
      }
    })
  }

  private async initMetricKeywords(folder: HydratedDocument<FolderDocument>, keys: Types.ObjectId[], article_id: Types.ObjectId) {
    await this.metricService.create({
      folder: folder._id,
      userId: folder.user,
      addresses: []
    })

    if (keys.length > 0) {
      this.initMetricParse(keys, article_id, folder)
    }
  }

  private async initMetricParse(keys: Types.ObjectId[], article_id: Types.ObjectId, folder: HydratedDocument<FolderDocument>) {
    new Promise((resolve) => {
      const result = this.folderMetricService
        .setDocuments(keys, article_id)
        .folderMetric(folder._id, folder.user);

      resolve(result);
    })
      .then(async (data) => {
        const metric = await data as IMetric
        this.metricService.updateMetricFolder({ folder: folder._id, metric }, folder.user);
      })
  }
}
