/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import {
  VisualizationTypes, ProjectTypes, FileTypes, UtilTypes, GenericTypes, ValidatorSchemas,
  DashboardTypes
} from '@illustry/types';
import { removeNullValues } from '../../utils/helper';
import {
  excelFilesToVisualizations,
  jsonFilesToVisualizations,
  csvFilesToVisualizations,
  xmlFilesToVisualizations
} from '../../utils/reader';
import Factory from '../../factory';
import DbaccInstance from '../../dbacc/lib';
import { resolveUserId } from '../user-scope';
import NoDataFoundError from '../../errors/noDataFoundError';
import { publish } from '../../realtime/broker';
import EmailService from '../../auth/email';
import logger from '../../config/logger';
import { normalizeShareCollaborators } from '../share-collaborators';

const createVisualizationShareId = () => `viz_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
const createInviteToken = () => `share_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
const getInviteTtlMs = () => Number(process.env.SHARE_INVITE_TTL_HOURS || 72) * 60 * 60 * 1000;

class VisualizationBZL implements GenericTypes.BaseBZL<
  VisualizationTypes.VisualizationCreate,
  VisualizationTypes.VisualizationUpdate,
  VisualizationTypes.VisualizationFilter,
  VisualizationTypes.VisualizationType,
  VisualizationTypes.ExtendedVisualizationType> {
  private dbaccInstance: DbaccInstance;

  constructor(dbaccInstance: DbaccInstance) {
    this.dbaccInstance = dbaccInstance;
  }

  private hasSharedAccess(
    visualization: VisualizationTypes.VisualizationType,
    userId: string,
    requiredPermission: VisualizationTypes.VisualizationSharePermission = 'viewer'
  ): boolean {
    if (visualization.userId === userId) {
      return true;
    }

    const collaborator = visualization.sharedWith?.find((sharedUser) => sharedUser.userId === userId);
    if (!collaborator) {
      return false;
    }
    if (collaborator.status && collaborator.status !== 'accepted') {
      return false;
    }

    return requiredPermission === 'viewer';
  }

  private getCollaboratorMetadata(
    visualization: VisualizationTypes.VisualizationType,
    userId: string
  ): Pick<VisualizationTypes.VisualizationType, 'currentUserRole' | 'shareStatus' | 'isExternal'> {
    if (visualization.userId === userId) {
      return { currentUserRole: 'owner', shareStatus: 'accepted', isExternal: false };
    }
    const collaborator = visualization.sharedWith?.find((sharedUser) => sharedUser.userId === userId);
    return {
      currentUserRole: collaborator ? 'viewer' : undefined,
      shareStatus: collaborator?.status || 'accepted',
      isExternal: true
    };
  }

  private async enrichRows(
    visualizations: VisualizationTypes.VisualizationType[] | undefined,
    requesterUserId: string
  ): Promise<VisualizationTypes.VisualizationType[]> {
    if (!visualizations) {
      return [];
    }

    const ownerIds = Array.from(new Set(
      visualizations
        .map((visualization) => visualization.userId)
        .filter((userId): userId is string => Boolean(userId))
    ));
    const owners = ownerIds.length > 0
      ? await this.dbaccInstance.Auth.findUsersByIds(ownerIds).catch(() => [])
      : [];
    const ownersById = new Map(owners.map((owner) => [owner._id.toString(), owner]));

    return visualizations.map((visualization) => {
      const plainVisualization = typeof (visualization as unknown as { toObject?: () => VisualizationTypes.VisualizationType }).toObject === 'function'
        ? (visualization as unknown as { toObject: () => VisualizationTypes.VisualizationType }).toObject()
        : visualization;
      const owner = visualization.userId ? ownersById.get(visualization.userId) : undefined;
      return {
        ...plainVisualization,
        ownerEmail: owner?.email,
        ownerName: owner?.name,
        ...this.getCollaboratorMetadata(visualization, requesterUserId)
      };
    });
  }

  create(data: VisualizationTypes.VisualizationCreate): Promise<VisualizationTypes.VisualizationType> {
    throw new Error('Method not implemented.');
  }

  update(
    filter: VisualizationTypes.VisualizationFilter,
    data: UtilTypes.DeepPartial<VisualizationTypes.VisualizationType>
  ): Promise<VisualizationTypes.VisualizationType | null> {
    return this.updateVisualization(filter, data);
  }

  private async updateVisualization(
    filter: VisualizationTypes.VisualizationFilter,
    data: VisualizationTypes.VisualizationUpdate
  ): Promise<VisualizationTypes.VisualizationType | null> {
    const userId = resolveUserId(filter.userId);
    const allowedUpdate: VisualizationTypes.VisualizationUpdate = {};
    if (data.theme) {
      allowedUpdate.theme = data.theme;
    }

    if (Object.keys(allowedUpdate).length === 0) {
      throw new Error('No supported visualization updates were provided');
    }

    if (filter.shareId) {
      const sharedVisualization = await this.findShared(filter.shareId, userId);
      if (!this.hasSharedAccess(sharedVisualization, userId, 'editor')) {
        throw new NoDataFoundError('Shared visualization was not found');
      }
      const updatedVisualization = await this.dbaccInstance.Visualization.updateFields(
        this.dbaccInstance.Visualization.createFilter({ shareId: filter.shareId }),
        allowedUpdate
      );
      if (updatedVisualization?.shareId) {
        publish({
          resource: 'visualization',
          shareId: updatedVisualization.shareId,
          action: 'updated',
          updatedAt: new Date().toISOString()
        });
      }
      return updatedVisualization;
    }

    const projectBZL = Factory.getInstance().getBZL().ProjectBZL;
    const { projects } = await projectBZL.browse({ userId, isActive: true } as ProjectTypes.ProjectFilter);
    if (!projects || projects.length === 0) {
      throw new Error('No active project');
    }

    const queryFilter = this.dbaccInstance.Visualization.createFilter({
      userId,
      projectName: projects[0].name,
      name: filter.name,
      type: filter.type
    });
    const updatedVisualization = await this.dbaccInstance.Visualization.updateFields(
      queryFilter,
      allowedUpdate
    );
    if (updatedVisualization?.shareId) {
      publish({
        resource: 'visualization',
        shareId: updatedVisualization.shareId,
        action: 'updated',
        updatedAt: new Date().toISOString()
      });
    }
    return updatedVisualization;
  }

  async syncEditableSharedThemes(
    userId: string,
    theme: Record<string, unknown>
  ): Promise<VisualizationTypes.VisualizationThemeSyncResult> {
    if (!theme || typeof theme !== 'object' || Array.isArray(theme)) {
      throw new Error('A valid theme payload is required');
    }

    const scopedUserId = resolveUserId(userId);
    const targets = await this.dbaccInstance.Visualization.findEditableSharedThemeTargets(scopedUserId);
    const shareIds = Array.from(new Set(
      targets
        .map((target) => target.shareId)
        .filter((shareId): shareId is string => Boolean(shareId))
    ));

    const updatedCount = await this.dbaccInstance.Visualization.updateThemeForShareIds(shareIds, theme);
    const updatedAt = new Date().toISOString();
    shareIds.forEach((shareId) => {
      publish({
        resource: 'visualization',
        shareId,
        action: 'theme-updated',
        updatedAt
      });
    });

    return {
      updatedCount,
      shareIds
    };
  }

  async createOrUpdate(
    visualization: VisualizationTypes.VisualizationCreate
  ): Promise<VisualizationTypes.VisualizationType | null> {
    const { name, type, projectName } = visualization;
    const userId = resolveUserId(visualization.userId);

    if (typeof type === 'string') {
      const visualizationFilter = this.dbaccInstance.Visualization.createFilter({
        userId,
        name,
        type,
        projectName
      });

      const returnedVisualization = await this.dbaccInstance.Visualization.update(
        visualizationFilter,
        visualization
      );
      if (returnedVisualization?.shareId) {
        publish({
          resource: 'visualization',
          shareId: returnedVisualization.shareId,
          action: 'updated',
          updatedAt: new Date().toISOString()
        });
      }
      return returnedVisualization;
    }
    await Promise.all(
      type.map(async (singleType) => {
        const visualizationFilter = this.dbaccInstance.Visualization.createFilter({
          userId,
          name,
          type: singleType,
          projectName
        });

        const visualizationUpdate: VisualizationTypes.VisualizationUpdate = { ...visualization, type: singleType };

        const updatedVisualization = await this.dbaccInstance.Visualization.update(
          visualizationFilter,
          visualizationUpdate
        );
        if (updatedVisualization?.shareId) {
          publish({
            resource: 'visualization',
            shareId: updatedVisualization.shareId,
            action: 'updated',
            updatedAt: new Date().toISOString()
          });
        }
      })
    );

    return visualization as VisualizationTypes.VisualizationType;
  }

  async createOrUpdateFromFiles(
    files: FileTypes.FileProperties[],
    includeAllFileDetails: boolean,
    visualizationUpdate: VisualizationTypes.VisualizationUpdate,
    fileDetails: FileTypes.FileDetails,
    userId?: string
  ): Promise<(VisualizationTypes.VisualizationType | null)[]> {
    const scopedUserId = resolveUserId(userId || visualizationUpdate.userId);
    const projectBZL = Factory.getInstance().getBZL().ProjectBZL;

    const { projects } = await projectBZL.browse({ userId: scopedUserId, isActive: true } as ProjectTypes.ProjectFilter);

    if (!projects || projects.length === 0) {
      throw new Error('No active project');
    }

    if (!fileDetails || Object.keys(fileDetails).length === 0) {
      throw new Error('No file details were provided');
    }

    const projectName = projects[0].name;
    switch (fileDetails.fileType) {
      case FileTypes.FileType.EXCEL:
        return this.processExcelFiles(
          files,
          includeAllFileDetails,
          projectName,
          fileDetails,
          visualizationUpdate,
          scopedUserId
        );
      case FileTypes.FileType.JSON:
        return this.processJsonFiles(
          files,
          includeAllFileDetails,
          projectName,
          visualizationUpdate,
          scopedUserId
        );
      case FileTypes.FileType.CSV:
        return this.processCsvFiles(
          files,
          includeAllFileDetails,
          projectName,
          fileDetails,
          visualizationUpdate,
          scopedUserId
        );
      case FileTypes.FileType.XML:
        return this.processXmlFiles(
          files,
          includeAllFileDetails,
          projectName,
          visualizationUpdate,
          scopedUserId
        );
      default:
        throw new Error('Invalid file type provided');
    }
  }

  async findOne(filter: VisualizationTypes.VisualizationFilter): Promise<VisualizationTypes.VisualizationType> {
    const projectBZL = Factory.getInstance().getBZL().ProjectBZL;
    const userId = resolveUserId(filter.userId);

    const { projects } = await projectBZL.browse({ userId, isActive: true } as ProjectTypes.ProjectFilter);

    if (!projects || projects.length === 0) {
      throw new Error('No active project');
    }

    const activeProjectName = projects[0].name;
    const updatedFilter = {
      ...filter,
      userId,
      projectName: activeProjectName
    };

    const queryFilter: UtilTypes.ExtendedMongoQuery = this.dbaccInstance.Visualization.createFilter(updatedFilter);
    const result = await this.dbaccInstance.Visualization.findOne(queryFilter);
    return result as VisualizationTypes.VisualizationType;
  }

  async findShared(
    shareId: string,
    requesterUserId: string
  ): Promise<VisualizationTypes.VisualizationType> {
    const queryFilter = this.dbaccInstance.Visualization.createFilter({ shareId });
    const foundVisualization = await this.dbaccInstance.Visualization.findOneWithSharing(queryFilter);
    if (!foundVisualization || !this.hasSharedAccess(foundVisualization, requesterUserId, 'viewer')) {
      throw new NoDataFoundError('Shared visualization was not found');
    }

    const owner = foundVisualization.userId
      ? await this.dbaccInstance.Auth.findUserById(foundVisualization.userId).catch(() => null)
      : null;
    return {
      ...foundVisualization,
      ownerEmail: owner?.email,
      ownerName: owner?.name,
      ...this.getCollaboratorMetadata(foundVisualization, requesterUserId)
    };
  }

  async share(
    filter: VisualizationTypes.VisualizationFilter,
    collaborators: VisualizationTypes.VisualizationShareRequest['collaborators'],
    theme?: VisualizationTypes.VisualizationShareRequest['theme']
  ): Promise<VisualizationTypes.VisualizationType> {
    const userId = resolveUserId(filter.userId);
    const visualization = await this.findOne(filter);
    const owner = await this.dbaccInstance.Auth.findUserById(userId);
    const normalizedCollaborators = normalizeShareCollaborators<VisualizationTypes.VisualizationSharePermission>(
      collaborators,
      owner?.email,
      'visualization'
    );
    const existingShareId = visualization.shareId || createVisualizationShareId();
    const existingSharedWith = visualization.sharedWith || [];
    const now = new Date();
    const expiresAt = new Date(now.getTime() + getInviteTtlMs());
    const sharedWithResults = await Promise.all(normalizedCollaborators.map(async (collaborator) => {
      const user = await this.dbaccInstance.Auth.findUserByEmailNormalized(collaborator.email);
      if (!user) {
        throw new NoDataFoundError(`No user was found for ${collaborator.email}`);
      }

      const previous = existingSharedWith.find((sharedUser) => sharedUser.userId === user._id.toString());
      const createdAt = previous?.createdAt || now;
      if (previous) {
        return null;
      }

      return {
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        permission: 'viewer',
        status: 'pending',
        inviteToken: createInviteToken(),
        inviteExpiresAt: expiresAt,
        sharedViaResource: 'visualization',
        sharedViaShareId: existingShareId,
        createdAt,
        updatedAt: now
      } as VisualizationTypes.VisualizationSharedUser;
    }));
    const sharedWith = sharedWithResults.filter(
      (sharedUser): sharedUser is VisualizationTypes.VisualizationSharedUser => Boolean(sharedUser)
    );
    const mergedSharedWith = [
      ...existingSharedWith.filter((existing) => !sharedWith.some((next) => next.userId === existing.userId)),
      ...sharedWith
    ];

    const projectBZL = Factory.getInstance().getBZL().ProjectBZL;
    const { projects } = await projectBZL.browse({ userId, isActive: true } as ProjectTypes.ProjectFilter);
    if (!projects || projects.length === 0) {
      throw new Error('No active project');
    }

    const queryFilter = this.dbaccInstance.Visualization.createFilter({
      userId,
      projectName: projects[0].name,
      name: filter.name,
      type: filter.type
    });
    const updatedVisualization = await this.dbaccInstance.Visualization.updateSharing(queryFilter, {
      shareId: existingShareId,
      sharedWith: mergedSharedWith,
      theme: theme || visualization.theme
    });
    if (!updatedVisualization) {
      throw new NoDataFoundError('Visualization was not found');
    }
    publish({
      resource: 'visualization',
      shareId: existingShareId,
      action: 'shared',
      updatedAt: new Date().toISOString()
    });
    sharedWith.forEach((sharedUser) => {
      if (!sharedUser.email || !sharedUser.inviteToken || !sharedUser.inviteExpiresAt) {
        return;
      }
      void new EmailService().sendShareInvitationEmail({
        email: sharedUser.email,
        ownerName: owner?.name || 'A teammate',
        resourceType: 'visualization',
        resourceName: visualization.name,
        permission: sharedUser.permission,
        token: sharedUser.inviteToken,
        expiresAt: sharedUser.inviteExpiresAt
      }).catch((error) => logger.warn('Unable to send visualization share invitation email', error));
    });
    return updatedVisualization;
  }

  async revokeShare(
    filter: VisualizationTypes.VisualizationFilter,
    sharedUserId: string
  ): Promise<VisualizationTypes.VisualizationType> {
    const userId = resolveUserId(filter.userId);
    const visualization = await this.findOne(filter);
    if (!visualization.shareId) {
      throw new NoDataFoundError('Visualization is not shared');
    }

    const isDirectVisualizationShare = (sharedUser: VisualizationTypes.VisualizationSharedUser) => (
      sharedUser.userId === sharedUserId
      && (
        !sharedUser.sharedViaResource
        || sharedUser.sharedViaResource === 'visualization'
        || sharedUser.sharedViaShareId === visualization.shareId
      )
    );
    const revokedUser = (visualization.sharedWith || []).find(isDirectVisualizationShare);
    if (!revokedUser) {
      throw new NoDataFoundError('Shared user was not found');
    }

    const owner = await this.dbaccInstance.Auth.findUserById(userId);
    const nextSharedWith = (visualization.sharedWith || []).filter(
      (sharedUser) => !isDirectVisualizationShare(sharedUser)
    );
    const projectBZL = Factory.getInstance().getBZL().ProjectBZL;
    const { projects } = await projectBZL.browse({ userId, isActive: true } as ProjectTypes.ProjectFilter);
    if (!projects || projects.length === 0) {
      throw new Error('No active project');
    }

    const updatedVisualization = await this.dbaccInstance.Visualization.updateSharing(
      this.dbaccInstance.Visualization.createFilter({
        userId,
        projectName: projects[0].name,
        name: filter.name,
        type: filter.type
      }),
      {
        shareId: visualization.shareId,
        sharedWith: nextSharedWith,
        theme: visualization.theme
      }
    );
    if (!updatedVisualization) {
      throw new NoDataFoundError('Visualization was not found');
    }

    publish({
      resource: 'visualization',
      shareId: visualization.shareId,
      action: 'shared',
      updatedAt: new Date().toISOString()
    });

    if (revokedUser.email) {
      void new EmailService().sendShareRevocationEmail({
        email: revokedUser.email,
        ownerName: owner?.name || 'A teammate',
        resourceType: 'visualization',
        resourceName: visualization.name
      }).catch((error) => logger.warn('Unable to send visualization share revocation email', error));
    }

    return updatedVisualization;
  }

  async browse(filter: VisualizationTypes.VisualizationFilter): Promise<VisualizationTypes.ExtendedVisualizationType> {
    const projectBZL = Factory.getInstance().getBZL().ProjectBZL;
    const userId = resolveUserId(filter.userId);

    const isExternal = filter.sharedScope === 'external';
    const { projects } = await projectBZL.browse({ userId, isActive: true } as ProjectTypes.ProjectFilter);

    if (!isExternal && (!projects || projects.length === 0)) {
      throw new Error('No active project');
    }

    const updatedFilter: VisualizationTypes.VisualizationFilter = isExternal
      ? {
        ...filter,
        userId: undefined,
        projectName: undefined,
        sharedWithUserId: userId,
        sharedScope: 'external'
      }
      : {
        ...filter,
        userId,
        projectName: projects?.[0]?.name,
        sharedScope: 'owned'
      };

    const queryFilter: UtilTypes.ExtendedMongoQuery = this.dbaccInstance.Visualization.createFilter(updatedFilter);

    const result = await this.dbaccInstance.Visualization.browse(queryFilter);
    return {
      ...result,
      visualizations: await this.enrichRows(result.visualizations, userId)
    };
  }

  async respondToInvite(token: string, decision: 'accept' | 'reject'): Promise<VisualizationTypes.VisualizationType> {
    const visualization = await this.dbaccInstance.Visualization.findOneByShareInviteToken(token);
    if (!visualization) {
      throw new NoDataFoundError('Share invitation was not found');
    }
    const now = new Date();
    const sharedWith = (visualization.sharedWith || []).map((sharedUser) => {
      if (sharedUser.inviteToken !== token) {
        return sharedUser;
      }
      if (sharedUser.inviteExpiresAt && new Date(sharedUser.inviteExpiresAt).getTime() < now.getTime()) {
        throw new NoDataFoundError('Share invitation expired');
      }
      return {
        ...sharedUser,
        status: (decision === 'accept' ? 'accepted' : 'rejected') as VisualizationTypes.VisualizationShareStatus,
        respondedAt: now,
        updatedAt: now
      };
    });
    const updatedVisualization = await this.dbaccInstance.Visualization.updateSharing(
      this.dbaccInstance.Visualization.createFilter({ shareId: visualization.shareId }),
      { shareId: visualization.shareId, sharedWith }
    );
    if (!updatedVisualization) {
      throw new NoDataFoundError('Visualization was not found');
    }
    return updatedVisualization;
  }

  async delete(filter: VisualizationTypes.VisualizationFilter): Promise<boolean> {
    const projectBZL = Factory.getInstance().getBZL().ProjectBZL;
    const userId = resolveUserId(filter.userId);

    if (filter.shareId) {
      const sharedVisualization = await this.findShared(filter.shareId, userId);
      if (sharedVisualization.userId !== userId) {
        const currentShare = (sharedVisualization.sharedWith || []).find(
          (sharedUser) => sharedUser.userId === userId
        );
        const now = new Date();
        const nextSharedWith = currentShare?.sharedViaResource === 'dashboard'
          ? (sharedVisualization.sharedWith || []).map((sharedUser) => (sharedUser.userId === userId
            ? {
              ...sharedUser,
              status: 'rejected' as VisualizationTypes.VisualizationShareStatus,
              inviteToken: undefined,
              inviteExpiresAt: undefined,
              respondedAt: now,
              updatedAt: now
            }
            : sharedUser))
          : (sharedVisualization.sharedWith || []).filter((sharedUser) => sharedUser.userId !== userId);
        await this.dbaccInstance.Visualization.updateSharing(
          this.dbaccInstance.Visualization.createFilter({ shareId: filter.shareId }),
          { shareId: filter.shareId, sharedWith: nextSharedWith, theme: sharedVisualization.theme }
        );
        publish({
          resource: 'visualization',
          shareId: filter.shareId,
          action: 'shared',
          updatedAt: new Date().toISOString()
        });
        return true;
      }
    }

    const { projects } = await projectBZL.browse({ userId, isActive: true } as ProjectTypes.ProjectFilter);

    if (!projects || projects.length === 0) {
      throw new Error('No active project');
    }

    const activeProjectName = projects[0].name;

    const updatedFilter: VisualizationTypes.VisualizationFilter = {
      ...filter,
      userId,
      projectName: activeProjectName
    };

    const queryFilter: UtilTypes.ExtendedMongoQuery = this.dbaccInstance.Visualization.createFilter(updatedFilter);

    const dashboardUpdateFilter: UtilTypes.ExtendedMongoQuery = this.dbaccInstance.Dashboard.createFilter(
      {
        userId,
        projectName: activeProjectName,
        visualizationName: filter.name,
        visualizationType: filter.type as string
      }
    );

    const { dashboards } = await this.dbaccInstance.Dashboard.browse(dashboardUpdateFilter, true);
    if (dashboards) {
      await Promise.all(dashboards.map(async (dashboard) => {
        if (dashboard.visualizations) {
          delete (dashboard.visualizations as { [name: string]: string; })[`${filter.name}_${filter.type}` as string];
          let reindexedLayouts: DashboardTypes.Layout[] = [];
          if (dashboard.layouts) {
            const updatedLayouts = dashboard.layouts.filter((layout) => layout.i !== filter.name);

            reindexedLayouts = updatedLayouts.map((layout, index) => ({
              ...layout,
              i: String(index)
            }));
          }
          const dashboardFilter: UtilTypes.ExtendedMongoQuery = this.dbaccInstance.Dashboard.createFilter(
            {
              userId,
              projectName: activeProjectName,
              name: dashboard.name
            }
          );

          await this.dbaccInstance.Dashboard.update(
            dashboardFilter,
            {
              $set: {
                visualizations: removeNullValues(dashboard.visualizations),
                layouts: removeNullValues(reindexedLayouts)
              }
            }
          );
        }
      }));
    }
    const deletedVisualization = await this.dbaccInstance.Visualization.findOneWithSharing(queryFilter);
    await this.dbaccInstance.Visualization.deleteMany(queryFilter);
    if (deletedVisualization?.shareId) {
      publish({
        resource: 'visualization',
        shareId: deletedVisualization.shareId,
        action: 'deleted',
        updatedAt: new Date().toISOString()
      });
    }
    return true;
  }

  private async processVisualizationDetails(
    illustrations: VisualizationTypes.VisualizationCreate[],
    includeAllFileDetails: boolean,
    projectName: string,
    visualizationUpdate: VisualizationTypes.VisualizationUpdate,
    userId: string
  ): Promise<(VisualizationTypes.VisualizationType | null)[]> {
    const processVisualization = async (illustration: VisualizationTypes.VisualizationCreate) => {
      const visualizationData: VisualizationTypes.VisualizationCreate = {
        ...(illustration as VisualizationTypes.VisualizationCreate),
        userId,
        projectName
      };

      if (!includeAllFileDetails) {
        Object.entries(visualizationUpdate).forEach(([key, value]) => {
          (visualizationData as Record<string, unknown>)[key] = value;
        });
      }

      visualizationData.userId = userId;
      visualizationData.projectName = projectName;

      ValidatorSchemas.validateWithSchema<
        VisualizationTypes.VisualizationCreate
      >(ValidatorSchemas.visualizationTypeSchema, visualizationData);

      return this.createOrUpdate(visualizationData);
    };

    return Promise.all(illustrations.map(processVisualization));
  }

  private async processJsonFiles(
    files: FileTypes.FileProperties[],
    includeAllFileDetails: boolean,
    projectName: string,
    visualizationUpdate: VisualizationTypes.VisualizationUpdate,
    userId: string
  ): Promise<(VisualizationTypes.VisualizationType | null)[]> {
    const visualizations = await jsonFilesToVisualizations(
      files,
      visualizationUpdate.type as VisualizationTypes.VisualizationTypesEnum,
      includeAllFileDetails
    );

    return this.processVisualizationDetails(
      visualizations as VisualizationTypes.VisualizationCreate[],
      includeAllFileDetails,
      projectName,
      visualizationUpdate,
      userId
    );
  }

  private async processXmlFiles(
    files: FileTypes.FileProperties[],
    includeAllFileDetails: boolean,
    projectName: string,
    visualizationUpdate: VisualizationTypes.VisualizationUpdate,
    userId: string
  ): Promise<(VisualizationTypes.VisualizationType | null)[]> {
    const visualizations = await xmlFilesToVisualizations(
      files,
      visualizationUpdate.type as VisualizationTypes.VisualizationTypesEnum,
      includeAllFileDetails
    );

    return this.processVisualizationDetails(
      visualizations as VisualizationTypes.VisualizationCreate[],
      includeAllFileDetails,
      projectName,
      visualizationUpdate,
      userId
    );
  }

  private async processExcelFiles(
    files: FileTypes.FileProperties[],
    includeAllFileDetails: boolean,
    projectName: string,
    fileDetails: FileTypes.FileDetails,
    visualizationUpdate: VisualizationTypes.VisualizationUpdate,
    userId: string
  ): Promise<(VisualizationTypes.VisualizationType | null)[]> {
    const visualizations = await excelFilesToVisualizations(
      files,
      fileDetails,
      visualizationUpdate.type as VisualizationTypes.VisualizationTypesEnum,
      includeAllFileDetails
    );

    return this.processVisualizationDetails(
      visualizations as VisualizationTypes.VisualizationCreate[],
      includeAllFileDetails,
      projectName,
      visualizationUpdate,
      userId
    );
  }

  private async processCsvFiles(
    files: FileTypes.FileProperties[],
    includeAllFileDetails: boolean,
    projectName: string,
    fileDetails: FileTypes.FileDetails,
    visualizationUpdate: VisualizationTypes.VisualizationUpdate,
    userId: string
  ): Promise<(VisualizationTypes.VisualizationType | null)[]> {
    const visualizations = await csvFilesToVisualizations(
      files,
      fileDetails,
      visualizationUpdate.type as VisualizationTypes.VisualizationTypesEnum,
      includeAllFileDetails
    );

    return this.processVisualizationDetails(
      visualizations as VisualizationTypes.VisualizationCreate[],
      includeAllFileDetails,
      projectName,
      visualizationUpdate,
      userId
    );
  }
}

export default VisualizationBZL;
