import { QueryOptions } from 'mongoose';
import { Document, FilterQuery, Model, PopulateOptions, UpdateQuery } from 'mongoose';

export abstract class AbstractRepository<T extends Document> {
  constructor(protected readonly abstractModel: Model<T>) { }

  async findOne(
    filterQuery: FilterQuery<T>,
    populate?: PopulateOptions | (string | PopulateOptions)[],
  ): Promise<T | null> {
    return populate === undefined
      ? await this.abstractModel.findOne(filterQuery).lean()
      : await this.abstractModel.findOne(filterQuery).populate(populate).lean();
  }

  async find(
    filterQuery?: FilterQuery<T>,
    populate?: PopulateOptions | (string | PopulateOptions)[],
  ): Promise<T[] | null> {
    return populate === undefined
      ? await this.abstractModel.find(filterQuery).lean()
      : await this.abstractModel.find(filterQuery).populate(populate).lean();
  }

  async create(
    createEntityData: unknown,
    populate?: PopulateOptions | (string | PopulateOptions)[],
  ): Promise<any> {
    const entity = new this.abstractModel(createEntityData);
    const create = await entity.save();
    if (create) {
      const data = populate ? await create.populate(populate) : create;
      return data;
    }
  }

  async findOneAndUpdate(
    filterQuery: FilterQuery<T>,
    updateEntityData: UpdateQuery<unknown>,
  ): Promise<T | null> {
    return await this.abstractModel.findOneAndUpdate(filterQuery, updateEntityData, {
      new: true,
    });
  }

  async deleteMany(filterQuery: FilterQuery<T>): Promise<boolean> {
    const result = await this.abstractModel.deleteMany(filterQuery);
    return result.deletedCount >= 0;
  }

  async updateMany(
    filterQuery: FilterQuery<T>,
    updateQuery: UpdateQuery<unknown>,
    options?: QueryOptions,
  ): Promise<boolean> {
    const result = await this.abstractModel.updateMany(filterQuery, updateQuery, options);
    return result.modifiedCount > 0;
  }

  async getCountDocuments(filterQuery: FilterQuery<T>): Promise<number> {
    return await this.abstractModel.countDocuments(filterQuery);
  }
}
