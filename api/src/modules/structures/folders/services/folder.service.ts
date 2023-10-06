import { Injectable, Logger } from "@nestjs/common";
import { FolderRepository } from "../repositories";
import { AddManyFolderDto, CreateFolderDto, GetOneFolderDto, RemovedKeysInFolderDto } from "../dto";
import { User } from "src/modules/auth";
import { FolderDocument } from "../schemas";
import { keysPopulate } from "../constants";
import { FilterQuery, PopulateOptions, Types } from "mongoose";


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

    async findOne(filterQuery: FilterQuery<FolderDocument>, sortQuery?: GetOneFolderDto): Promise<FolderDocument> {
        let populate: PopulateOptions | (string | PopulateOptions)[];

        if (sortQuery) {
            populate = await keysPopulate(sortQuery);
        };

        return await this.folderRepository.findOne(filterQuery, populate);
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

}