import validator from 'validator';
import {
  DashboardTypes, GenericTypes, UtilTypes
} from '@illustry/types';
import ModelInstance from '../../models/modelInstance';

const PAGE_SIZE = 10;
class Dashboard implements GenericTypes.BaseLib<
  DashboardTypes.DashboardCreate,
  DashboardTypes.DashboardUpdate,
  DashboardTypes.DashboardFilter,
  DashboardTypes.DashboardType,
  DashboardTypes.ExtendedDashboardType> {
  private modelInstance: ModelInstance;

  constructor(modelInstance: ModelInstance) {
    this.modelInstance = modelInstance;
  }

  createFilter(filter: DashboardTypes.DashboardFilter): UtilTypes.ExtendedMongoQuery {
    const query: UtilTypes.MongoQuery = { $and: [] };
    if (filter.userId) {
      (query.$and as Array<object>).push({
        userId: filter.userId
      });
    }
    if (filter.shareId) {
      (query.$and as Array<object>).push({
        shareId: filter.shareId
      });
    }
    if (filter.sharedWithUserId) {
      if (filter.sharedScope === 'external') {
        (query.$and as Array<object>).push({
          userId: { $ne: filter.sharedWithUserId },
          sharedWith: {
            $elemMatch: {
              userId: filter.sharedWithUserId,
              $or: [
                { status: 'accepted' },
                { status: { $exists: false } }
              ]
            }
          }
        });
      } else if (filter.sharedScope === 'all') {
        (query.$and as Array<object>).push({
          $or: [
            { userId: filter.sharedWithUserId },
            {
              sharedWith: {
                $elemMatch: {
                  userId: filter.sharedWithUserId,
                  $or: [
                    { status: 'accepted' },
                    { status: { $exists: false } }
                  ]
                }
              }
            }
          ]
        });
      }
    }
    if (filter.name) {
      (query.$and as Array<object>).push({
        name: filter.name
      });
    }
    if (filter.projectName) {
      (query.$and as Array<object>).push({
        projectName: filter.projectName
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
          },
          {
            type: { $regex: regexPattern }
          },
          {
            tags: { $in: [regexPattern] }
          }
        ]
      });
    }
    if (filter.visualizationName && filter.visualizationType) {
      (query.$and as Array<object>).push({
        [`visualizations.${filter.visualizationName}_${filter.visualizationType}`]: filter.visualizationType
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

  create(data: DashboardTypes.DashboardCreate): Promise<DashboardTypes.DashboardType> {
    const finalData = { ...data };
    if (!finalData.createdAt) {
      finalData.createdAt = new Date();
      finalData.updatedAt = new Date();
    }
    return this.modelInstance.DashboardModel.create(finalData);
  }

  findOne(filter: UtilTypes.ExtendedMongoQuery): Promise<DashboardTypes.DashboardType | null> {
    return this.modelInstance.DashboardModel.findOne(filter.query, {
      __v: 0,
      _id: 0,
      userId: 0
    }).lean().exec() as unknown as Promise<DashboardTypes.DashboardType | null>;
  }

  findOneWithSharing(filter: UtilTypes.ExtendedMongoQuery): Promise<DashboardTypes.DashboardType | null> {
    return this.modelInstance.DashboardModel.findOne(filter.query, {
      __v: 0,
      _id: 0
    }).lean().exec() as unknown as Promise<DashboardTypes.DashboardType | null>;
  }

  findOneByShareInviteToken(token: string): Promise<DashboardTypes.DashboardType | null> {
    return this.modelInstance.DashboardModel.findOne(
      { 'sharedWith.inviteToken': token },
      { __v: 0, _id: 0 }
    ).lean().exec() as unknown as Promise<DashboardTypes.DashboardType | null>;
  }

  async browse(filter: UtilTypes.ExtendedMongoQuery, withVisualizations = false): Promise<DashboardTypes.ExtendedDashboardType> {
    const projection: Record<string, number> = {
      __v: 0,
      _id: 0,
      projectName: 0
    };

    if (!withVisualizations) {
      projection.visualizations = 0;
    }

    const res = await (this.modelInstance.DashboardModel.find(
      filter.query ? filter.query : {},
      projection,
      {
        sort: filter.sort ? filter.sort : { name: 1 },
        skip: filter && filter.page ? Number(filter.page) : 0,
        limit: filter.per_page
      }
    ).lean().exec() as unknown as Promise<DashboardTypes.DashboardType[]>);
    const count = await this.modelInstance.DashboardModel.countDocuments(
      filter.query ? filter.query : {}
    ).exec();
    return {
      dashboards: res,
      pagination: {
        count,
        pageCount:
          count > 0
            ? count / (filter.per_page ? filter.per_page : PAGE_SIZE)
            : 1
      }
    };
  }

  // async updateMany(
  //   filter: UtilTypes.ExtendedMongoQuery,
  //   data: Record<string, unknown>
  // ): Promise<number> {
  //   const finalData = { ...data };

  //   if (!finalData.updatedAt) {
  //     finalData.updatedAt = new Date();
  //   }
  //   const result = await this.modelInstance.DashboardModel.updateMany(
  //     filter.query,
  //     data
  //   ).exec();
  //   return result.modifiedCount;
  // }

  update(
    filter: UtilTypes.ExtendedMongoQuery,
    data: DashboardTypes.DashboardUpdate | Record<string, unknown>
  ): Promise<DashboardTypes.DashboardType | null> {
    const finalData = { ...data };
    if (!finalData.createdAt) {
      finalData.createdAt = new Date();
    }
    finalData.updatedAt = new Date();
    return this.modelInstance.DashboardModel.findOneAndUpdate(
      filter.query,
      finalData,
      { upsert: true, new: true }
    ).lean().exec() as unknown as Promise<DashboardTypes.DashboardType | null>;
  }

  partialUpdate(
    filter: UtilTypes.ExtendedMongoQuery,
    data: DashboardTypes.DashboardUpdate
  ): Promise<DashboardTypes.DashboardType | null> {
    const finalData = { ...data };
    if (!finalData.createdAt) {
      finalData.createdAt = new Date();
    }
    finalData.updatedAt = new Date();
    return this.modelInstance.DashboardModel.findOneAndUpdate(
      filter.query,
      { $set: { updatedAt: new Date(), layouts: data.layouts } },
      { upsert: true, new: true }
    ).lean().exec() as unknown as Promise<DashboardTypes.DashboardType | null>;
  }

  updateSharing(
    filter: UtilTypes.ExtendedMongoQuery,
    data: Pick<DashboardTypes.DashboardUpdate, 'shareId' | 'sharedWith'>
  ): Promise<DashboardTypes.DashboardType | null> {
    return this.modelInstance.DashboardModel.findOneAndUpdate(
      filter.query,
      {
        $set: {
          shareId: data.shareId,
          sharedWith: data.sharedWith,
          updatedAt: new Date()
        }
      },
      { new: true }
    ).exec();
  }

  async delete(filter: UtilTypes.ExtendedMongoQuery): Promise<boolean> {
    await this.modelInstance.DashboardModel.deleteOne(filter.query).exec();
    return true;
  }

  async deleteMany(filter: UtilTypes.ExtendedMongoQuery): Promise<boolean> {
    await this.modelInstance.DashboardModel.deleteMany(filter.query).exec();
    return true;
  }
}

export default Dashboard;
