import { Injectable, Logger } from "@nestjs/common";
import { FolderRepository } from "../repositories";
import { AddManyFolderDto, CreateFolderDto, GetListDto, GetOneFolderDto, RemoveFolderDto, RemovedKeysInFolderDto } from "../dto";
import { User } from "src/modules/auth";
import { FolderDocument } from "../schemas";
import { keysPopulateAndQuery } from "../constants";
import { FilterQuery, HydratedDocument, PopulateOptions, Types, UpdateQuery } from "mongoose";
import { chunk } from "lodash";
import { PaginationUtils } from "src/modules/utils/providers";
import { IPaginationResponse } from "src/modules/utils/types";


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

    async findAll(user: User, article: Types.ObjectId, dto: GetListDto, query?: { search: string }): Promise<IPaginationResponse> {
        const data = await this.folderRepository.findList(user, article, query);
        return await this.paginationUtils.paginate(dto.pagination, data, 'folders')
    }

    async findOne(filterQuery: FilterQuery<FolderDocument>, sortQuery?): Promise<IPaginationResponse | HydratedDocument<FolderDocument>> {
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
        const { ids_folders, ids_keys } = dto
        return await this.folderRepository.updateMany({ _id: ids_folders, user }, { $addToSet: { keys: ids_keys } })
    }

    async removedManyKeys(dto: RemovedKeysInFolderDto, user: User) {
        return await this.folderRepository.findOneAndUpdate({ _id: dto.id_folder, user: user }, { $pull: { keys: { $in: dto.ids_keys } } })
    }

    async refreshFolder() {
        //
    }

    async removeFolder(dto: RemoveFolderDto, user: User): Promise<boolean> {
        return await this.folderRepository.deleteMany({ _id: dto._id, user: user });
    }

    async update(updateQuery: UpdateQuery<FolderDocument>) {
        return await this.folderRepository.findOneAndUpdate({ _id: updateQuery._id }, updateQuery)
    }

}