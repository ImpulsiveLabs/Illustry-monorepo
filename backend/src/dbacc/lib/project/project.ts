import validator from 'validator';
import {
  ProjectTypes, GenericTypes, UtilTypes
} from '@illustry/types';
import ModelInstance from '../../models/modelInstance';

const PAGE_SIZE = 10;
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
      const regexPattern = new RegExp(
        validator.blacklist(filter.text, "<>\"'&;@()[]{}/\\|%+=?~`,$"),
        'i'
      );
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

    if ((query.$and as Array<object>).length === 0) delete query.$and;

    let skip: number = 0;
    if (filter && filter.page && filter.page >= 1) {
      if (filter.per_page) {
        skip = (filter.page - 1) * filter.per_page;
      } else {
        skip = (filter.page - 1) * PAGE_SIZE;
      }
    }

    let sort = {};
    if (filter.sort && filter.sort.element) {
      const sortField = filter.sort.element;
      const sortOrder = filter.sort.sortOrder === -1 ? -1 : 1;
      sort = { [sortField]: sortOrder };
    }
    return {
      query,
      page: skip,
      sort,
      per_page: filter.per_page ? filter.per_page : PAGE_SIZE
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
    }).exec();
  }

  async browse(filter: UtilTypes.ExtendedMongoQuery): Promise<ProjectTypes.ExtendedProjectType> {
    const res = await this.modelInstance.ProjectModel.find(
      filter.query ? filter.query : {},
      {
        __v: 0,
        _id: 0,
        userId: 0
      },
      {
        sort: filter.sort ? filter.sort : { name: 1 },
        skip: filter && filter.page ? filter.page : 0,
        limit: filter.per_page
      }
    ).exec();
    const count = await this.modelInstance.ProjectModel.countDocuments(
      filter.query ? filter.query : {}
    ).exec();
    return {
      projects: res,
      pagination: {
        count,
        pageCount:
          count > 0
            ? count / (filter.per_page ? filter.per_page : PAGE_SIZE)
            : 1
      }
    };
  }

  async update(
    filter: UtilTypes.ExtendedMongoQuery,
    data: ProjectTypes.ProjectUpdate
  ): Promise<ProjectTypes.ProjectType | null> {
    const foundProject = await this.findOne(filter);
    const finalData: ProjectTypes.ProjectUpdate = { ...data };
    if (foundProject) {
      if (!finalData.createdAt) {
        finalData.createdAt = new Date();
      }
    }
    finalData.updatedAt = new Date();
    if (data.isActive !== true) {
      return this.modelInstance.ProjectModel.findOneAndUpdate(
        filter.query,
        data,
        {
          upsert: true,
          new: true
        }
      );
    }
    await this.modelInstance.ProjectModel.updateMany(
      { userId: finalData.userId },
      { $set: { isActive: false } }
    ).exec();
    return this.modelInstance.ProjectModel.findOneAndUpdate(
      filter.query,
      data,
      {
        upsert: true,
        new: true
      }
    ).exec();
  }

  async delete(filter: UtilTypes.ExtendedMongoQuery): Promise<boolean> {
    await this.modelInstance.ProjectModel.deleteOne(filter.query).exec();
    return true;
  }
}
export default Project;
