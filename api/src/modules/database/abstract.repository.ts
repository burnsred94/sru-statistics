import { Document, FilterQuery, Model, UpdateQuery } from 'mongoose';

export abstract class AbstractRepository<T extends Document> {
    constructor(protected readonly abstractModel: Model<T>) { }

    async findOne(filterQuery: FilterQuery<T>, projection?: Record<string, unknown>): Promise<T | null> {
        return await this.abstractModel.findOne(filterQuery, projection).exec();
    }

    async find(filterQuery?: FilterQuery<T>): Promise<T[] | null> {
        return await this.abstractModel.find(filterQuery).exec();
    }

    async create(createEntityData: unknown): Promise<T | null> {
        const entity = new this.abstractModel(createEntityData);
        return await entity.save();
    }

    async findOneAndUpdate(filterQuery: FilterQuery<T>, updateEntityData: UpdateQuery<unknown>): Promise<T | null> {
        return await this.abstractModel.findOneAndUpdate(filterQuery, updateEntityData, {
            new: true,
        });
    }

    async deleteMany(filterQuery: FilterQuery<T>): Promise<boolean> {
        const result = await this.abstractModel.deleteMany(filterQuery);
        return result.deletedCount >= 0;
    }

    async getCountDocuments(filterQuery: FilterQuery<T>): Promise<number> {
        return await this.abstractModel.countDocuments(filterQuery);
    }
}