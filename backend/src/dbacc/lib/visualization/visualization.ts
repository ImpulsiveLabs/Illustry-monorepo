import validator from 'validator';
import {
  VisualizationTypes, GenericTypes, UtilTypes
} from '@illustry/types';
import ModelInstance from '../../models/modelInstance';

const PAGE_SIZE = 10;
class Visualization implements GenericTypes.BaseLib<
  VisualizationTypes.VisualizationCreate,
  VisualizationTypes.VisualizationUpdate,
  VisualizationTypes.VisualizationFilter,
  VisualizationTypes.VisualizationType,
  VisualizationTypes.ExtendedVisualizationType> {
  private modelInstance: ModelInstance;

  constructor(modelInstance: ModelInstance) {
    this.modelInstance = modelInstance;
  }

  createFilter(filter: VisualizationTypes.VisualizationFilter): UtilTypes.ExtendedMongoQuery {
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
    if (filter.tags) {
      (query.$and as Array<object>).push({
        tags: { $in: filter.tags }
      });
    }
    if (filter.type) {
      if (typeof filter.type === 'string') {
        (query.$and as Array<object>).push({
          type: filter.type
        });
      } else {
        (query.$and as Array<object>).push({
          type: { $in: filter.type }
        });
      }
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

  create(data: VisualizationTypes.VisualizationCreate): Promise<VisualizationTypes.VisualizationType> {
    const finalData = { ...data };
    if (!finalData.createdAt) {
      finalData.createdAt = new Date();
      finalData.updatedAt = new Date();
    }
    return this.modelInstance.VisualizationModel.create(finalData);
  }

  findOne(filter: UtilTypes.ExtendedMongoQuery): Promise<VisualizationTypes.VisualizationType | null> {
    return this.modelInstance.VisualizationModel.findOne(filter.query, {
      __v: 0,
      _id: 0,
      userId: 0
    }).lean().exec() as unknown as Promise<VisualizationTypes.VisualizationType | null>;
  }

  findOneWithSharing(filter: UtilTypes.ExtendedMongoQuery): Promise<VisualizationTypes.VisualizationType | null> {
    return this.modelInstance.VisualizationModel.findOne(filter.query, {
      __v: 0,
      _id: 0
    }).lean().exec() as unknown as Promise<VisualizationTypes.VisualizationType | null>;
  }

  findOneByShareInviteToken(token: string): Promise<VisualizationTypes.VisualizationType | null> {
    return this.modelInstance.VisualizationModel.findOne(
      { 'sharedWith.inviteToken': token },
      { __v: 0, _id: 0 }
    ).lean().exec() as unknown as Promise<VisualizationTypes.VisualizationType | null>;
  }

  findEditableSharedThemeTargets(userId: string): Promise<Array<Pick<VisualizationTypes.VisualizationType, 'shareId'>>> {
    return this.modelInstance.VisualizationModel.find(
      {
        shareId: { $exists: true, $ne: null },
        $or: [
          { userId },
          {
            sharedWith: {
              $elemMatch: {
                userId,
                permission: 'editor',
                $or: [
                  { status: 'accepted' },
                  { status: { $exists: false } }
                ]
              }
            }
          }
        ]
      },
      { _id: 0, shareId: 1 }
    ).lean().exec() as unknown as Promise<Array<Pick<VisualizationTypes.VisualizationType, 'shareId'>>>;
  }

  async browse(filter: UtilTypes.ExtendedMongoQuery): Promise<VisualizationTypes.ExtendedVisualizationType> {
    const res = await (this.modelInstance.VisualizationModel.find(
      filter.query ? filter.query : {},
      {
        __v: 0,
        _id: 0,
        data: 0,
        projectName: 0
      },
      {
        sort: filter.sort ? filter.sort : { name: 1 },
        skip: filter && filter.page ? Number(filter.page) : 0,
        limit: filter.per_page
      }
    ).lean().exec() as unknown as Promise<VisualizationTypes.VisualizationType[]>);
    const count = await this.modelInstance.VisualizationModel.countDocuments(
      filter.query ? filter.query : {}
    );
    return {
      visualizations: res,
      pagination: {
        count,
        pageCount:
          count > 0
            ? count / (filter.per_page ? filter.per_page : PAGE_SIZE)
            : 1
      }
    };
  }

  update(
    filter: UtilTypes.ExtendedMongoQuery,
    data: VisualizationTypes.VisualizationUpdate
  ): Promise<VisualizationTypes.VisualizationType | null> {
    const finalData = { ...data };
    if (!finalData.createdAt) {
      finalData.createdAt = new Date();
    }
    finalData.updatedAt = new Date();
    return this.modelInstance.VisualizationModel.findOneAndUpdate(
      filter.query,
      finalData,
      { upsert: true, new: true }
    ).lean().exec() as unknown as Promise<VisualizationTypes.VisualizationType | null>;
  }

  updateFields(
    filter: UtilTypes.ExtendedMongoQuery,
    data: VisualizationTypes.VisualizationUpdate
  ): Promise<VisualizationTypes.VisualizationType | null> {
    return this.modelInstance.VisualizationModel.findOneAndUpdate(
      filter.query,
      {
        $set: {
          ...data,
          updatedAt: new Date()
        }
      },
      { new: true }
    ).lean().exec() as unknown as Promise<VisualizationTypes.VisualizationType | null>;
  }

  updateSharing(
    filter: UtilTypes.ExtendedMongoQuery,
    data: Pick<VisualizationTypes.VisualizationUpdate, 'shareId' | 'sharedWith' | 'theme'>
  ): Promise<VisualizationTypes.VisualizationType | null> {
    const $set: VisualizationTypes.VisualizationUpdate = {
      shareId: data.shareId,
      sharedWith: data.sharedWith,
      updatedAt: new Date()
    };
    if (data.theme) {
      $set.theme = data.theme;
    }
    return this.modelInstance.VisualizationModel.findOneAndUpdate(
      filter.query,
      {
        $set
      },
      { new: true }
    ).lean().exec() as unknown as Promise<VisualizationTypes.VisualizationType | null>;
  }

  async updateThemeForShareIds(
    shareIds: string[],
    theme: Record<string, unknown>
  ): Promise<number> {
    if (shareIds.length === 0) {
      return 0;
    }

    const result = await this.modelInstance.VisualizationModel.updateMany(
      { shareId: { $in: shareIds } },
      {
        $set: {
          theme,
          updatedAt: new Date()
        }
      }
    ).exec();

    return Number(result.modifiedCount || 0);
  }

  async delete(filter: UtilTypes.ExtendedMongoQuery): Promise<boolean> {
    await this.modelInstance.VisualizationModel.deleteOne(filter.query).exec();
    return true;
  }

  async deleteMany(filter: UtilTypes.ExtendedMongoQuery): Promise<boolean> {
    await this.modelInstance.VisualizationModel.deleteMany(filter.query).exec();
    return true;
  }
}

export default Visualization;
