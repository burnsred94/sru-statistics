import { Injectable, Logger } from '@nestjs/common';
import { FolderRepository } from '../repositories';
import {
    AddManyFolderDto,
    CreateFolderDto,
    GetListDto,
    RemoveFolderDto,
    RemovedKeysInFolderDto,
} from '../dto';
import { User } from 'src/modules/auth';
import { FolderDocument } from '../schemas';
import { keysPopulateAndQuery } from '../constants';
import { FilterQuery, HydratedDocument, PopulateOptions, Types, UpdateQuery } from 'mongoose';
import { PaginationUtils } from 'src/modules/utils/providers';
import { IPaginationResponse } from 'src/modules/utils/types';
import { IManyFolderResponse } from '../types';
import { reduce } from 'lodash';

@Injectable()
export class FolderService {
    protected readonly logger = new Logger(FolderService.name);

    constructor(
        private readonly folderRepository: FolderRepository,
        private readonly paginationUtils: PaginationUtils,
    ) { }

    async create(dto: CreateFolderDto, user: User): Promise<FolderDocument> {
        return await this.folderRepository.create({ user: user, ...dto });
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
            console.log(modified_name);

            if (findName) {
                count++;
            } else {
                find = true;
                return await this.folderRepository.create({ user: user, ...dto, name: modified_name });
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
    ): Promise<IPaginationResponse | HydratedDocument<FolderDocument>> {
        let populate: PopulateOptions | (string | PopulateOptions)[];

        if (sortQuery) {
            populate = await keysPopulateAndQuery(sortQuery);
        } else {
            return await this.folderRepository.findOne(filterQuery);
        }

        const pagination = sortQuery.pagination;

        const data = await this.folderRepository.findOne(filterQuery, populate);

        return await this.paginationUtils.paginate(pagination, data.keys, 'keys');
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

    async refreshFolder() {
        //
    }

    async removeFolder(dto: RemoveFolderDto, user: User): Promise<boolean> {
        return await this.folderRepository.deleteMany({ _id: dto._id, user: user });
    }

    async update(updateQuery: UpdateQuery<FolderDocument>) {
        return await this.folderRepository.findOneAndUpdate({ _id: updateQuery._id }, updateQuery);
    }
}
