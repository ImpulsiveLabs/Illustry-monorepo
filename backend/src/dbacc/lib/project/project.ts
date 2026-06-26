import {
  ProjectTypes, GenericTypes, UtilTypes
} from '@illustry/types';
import ModelInstance from '../../models/modelInstance';
import {
  DEFAULT_PAGE_SIZE,
  buildSafeTextRegex,
  getPageCount,
  getPerPage,
  getSafeSort,
  getSkip
} from '../query-utils';

const SORT_FIELDS = new Set(['name', 'createdAt', 'updatedAt', 'isActive']);

class Project implements GenericTypes.BaseLib<
  ProjectTypes.ProjectCreate,
  ProjectTypes.ProjectUpdate,
  ProjectTypes.ProjectFilter,
  ProjectTypes.ProjectType,
  ProjectTypes.ExtendedProjectType> {
  private modelInstance: ModelInstance;

  constructor(modelInstance: ModelInstance) {
    this.modelInstance = modelInstance;
  }

  createFilter(filter: ProjectTypes.ProjectFilter): UtilTypes.ExtendedMongoQuery {
    const query: UtilTypes.MongoQuery = { $and: [] };
    if (filter.userId) {
      (query.$and as Array<object>).push({
        userId: filter.userId
      });
    }
    if (filter.name) {
      (query.$and as Array<object>).push({
        name: filter.name
      });
    }
    if (filter.isActive !== undefined) {
      (query.$and as Array<object>).push({
        isActive: filter.isActive
      });
    }
    if (filter.text) {
      const regexPattern = buildSafeTextRegex(filter.text);
      if (regexPattern) {
        (query.$and as Array<object>).push({
          $or: [
            {
              name: { $regex: regexPattern }
            },
            {
              description: { $regex: regexPattern }
            }
          ]
        });
      }
    }

    if ((query.$and as Array<object>).length === 0) delete query.$and;

    const perPage = getPerPage(filter.per_page);

    return {
      query,
      page: getSkip(filter.page, perPage),
      sort: getSafeSort(filter.sort, SORT_FIELDS, {}),
      per_page: perPage
    };
  }

  async create(data: ProjectTypes.ProjectCreate): Promise<ProjectTypes.ProjectType> {
    const finalData: ProjectTypes.ProjectCreate = { ...data };
    if (!finalData.createdAt) {
      finalData.createdAt = new Date();
      finalData.updatedAt = new Date();
    }
    if (!finalData.isActive) {
      return this.modelInstance.ProjectModel.create(finalData);
    }

    if (!finalData.userId) {
      throw new Error('Missing userId for project creation');
    }

    await this.modelInstance.ProjectModel.updateMany(
      { userId: finalData.userId },
      { $set: { isActive: false } }
    ).exec();
    return this.modelInstance.ProjectModel.create(finalData);
  }

  findOne(filter: UtilTypes.ExtendedMongoQuery): Promise<ProjectTypes.ProjectType | null> {
    return this.modelInstance.ProjectModel.findOne(filter.query, {
      __v: 0,
      _id: 0,
      userId: 0
    }).lean().exec() as unknown as Promise<ProjectTypes.ProjectType | null>;
  }

  async browse(filter: UtilTypes.ExtendedMongoQuery): Promise<ProjectTypes.ExtendedProjectType> {
    const query = filter.query ? filter.query : {};
    const perPage = filter.per_page || DEFAULT_PAGE_SIZE;
    const [res, count] = await Promise.all([
      this.modelInstance.ProjectModel.find(
        query,
        {
          __v: 0,
          _id: 0,
          userId: 0
        },
        {
          sort: filter.sort ? filter.sort : { name: 1 },
          skip: filter && filter.page ? filter.page : 0,
          limit: perPage
        }
      ).lean().exec() as unknown as Promise<ProjectTypes.ProjectType[]>,
      this.modelInstance.ProjectModel.countDocuments(query).exec()
    ]);
    return {
      projects: res,
      pagination: {
        count,
        pageCount: getPageCount(count, perPage)
      }
    };
  }

  async update(
    filter: UtilTypes.ExtendedMongoQuery,
    data: ProjectTypes.ProjectUpdate
  ): Promise<ProjectTypes.ProjectType | null> {
    const finalData: ProjectTypes.ProjectUpdate = { ...data };
    finalData.updatedAt = new Date();
    if (data.isActive !== true) {
      return this.modelInstance.ProjectModel.findOneAndUpdate(
        filter.query,
        finalData,
        {
          new: true
        }
      ).lean().exec() as unknown as Promise<ProjectTypes.ProjectType | null>;
    }
    await this.modelInstance.ProjectModel.updateMany(
      { userId: finalData.userId },
      { $set: { isActive: false } }
    ).exec();
    return this.modelInstance.ProjectModel.findOneAndUpdate(
      filter.query,
      finalData,
      {
        new: true
      }
    ).lean().exec() as unknown as Promise<ProjectTypes.ProjectType | null>;
  }

  async delete(filter: UtilTypes.ExtendedMongoQuery): Promise<boolean> {
    const result = await this.modelInstance.ProjectModel.deleteOne(filter.query).exec();
    return result.deletedCount > 0;
  }
}
export default Project;
