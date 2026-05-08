import {
  DashboardTypes, GenericTypes, UtilTypes
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

const SORT_FIELDS = new Set(['name', 'createdAt', 'updatedAt']);

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
    if (filter.visualizationName && filter.visualizationType) {
      (query.$and as Array<object>).push({
        [`visualizations.${filter.visualizationName}_${filter.visualizationType}`]: filter.visualizationType
      });
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

    const query = filter.query ? filter.query : {};
    const perPage = filter.per_page || DEFAULT_PAGE_SIZE;
    const [res, count] = await Promise.all([
      this.modelInstance.DashboardModel.find(
        query,
        projection,
        {
          sort: filter.sort ? filter.sort : { name: 1 },
          skip: filter && filter.page ? Number(filter.page) : 0,
          limit: perPage
        }
      ).lean().exec() as unknown as Promise<DashboardTypes.DashboardType[]>,
      this.modelInstance.DashboardModel.countDocuments(query).exec()
    ]);
    return {
      dashboards: res,
      pagination: {
        count,
        pageCount: getPageCount(count, perPage)
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
