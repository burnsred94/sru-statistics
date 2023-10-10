import { Injectable, Logger } from "@nestjs/common";
import { FolderRepository } from "../repositories";
import { AddManyFolderDto, CreateFolderDto, GetOneFolderDto, RemoveFolderDto, RemovedKeysInFolderDto } from "../dto";
import { User } from "src/modules/auth";
import { FolderDocument } from "../schemas";
import { keysPopulateAndQuery } from "../constants";
import { FilterQuery, PopulateOptions, Types } from "mongoose";
import { chunk } from "lodash";


@Injectable()
export class FolderService {
    protected readonly logger = new Logger(FolderService.name);

    constructor(private readonly folderRepository: FolderRepository) { }

    async create(dto: CreateFolderDto, user: User): Promise<FolderDocument> {
        return await this.folderRepository.create({ user: user, ...dto });
    }

    async findAll(user: User, article: Types.ObjectId): Promise<FolderDocument[]> {
        return await this.folderRepository.findList(user, article);
    }

    async findOne(filterQuery: FilterQuery<FolderDocument>, sortQuery?) {
        let populate: PopulateOptions | (string | PopulateOptions)[];

        const pagination = sortQuery.pagination;

        if (sortQuery) {
            populate = await keysPopulateAndQuery(sortQuery);
        };

        const data = await this.folderRepository.findOne(filterQuery, populate);
        const total_keys = data.keys.length;

        let keys: Types.ObjectId[],
            page: number,
            total: number,
            page_size: number;

        const chunks = chunk(data.keys, pagination.limit);

        if (chunks[pagination.page - 1]) {
            keys = chunks[pagination.page - 1],
                page = pagination.page,
                total = chunks.length,
                page_size = pagination.limit;
        } else {
            keys = chunks[0],
                page = 1,
                total = chunks.length,
                page_size = pagination.limit;
        }

        return {
            keys,
            meta: {
                page, total, page_size,
            },
            total_keys,
        }
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

}