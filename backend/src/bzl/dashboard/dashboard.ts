import {
  DashboardTypes,
  UtilTypes,
  GenericTypes,
  VisualizationTypes,
  ProjectTypes
} from '@illustry/types';
import Factory from '../../factory';
import DbaccInstance from '../../dbacc/lib';
import NoDataFoundError from '../../errors/noDataFoundError';
import logger from '../../config/logger';
import DuplicatedElementError from '../../errors/duplicatedElementError';
import { resolveUserId } from '../user-scope';
import { publish } from '../../realtime/broker';
import EmailService from '../../auth/email';
import { normalizeShareCollaborators } from '../share-collaborators';

const createDashboardShareId = () => `dash_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
const createInviteToken = () => `share_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
const getInviteTtlMs = () => Number(process.env.SHARE_INVITE_TTL_HOURS || 72) * 60 * 60 * 1000;

class DashboardBZL implements GenericTypes.BaseBZL<
  DashboardTypes.DashboardCreate,
  DashboardTypes.DashboardUpdate,
  DashboardTypes.DashboardFilter,
  DashboardTypes.DashboardType,
  DashboardTypes.ExtendedDashboardType> {
  private dbaccInstance: DbaccInstance;

  constructor(dbaccInstance: DbaccInstance) {
    this.dbaccInstance = dbaccInstance;
  }

  private hasSharedAccess(
    dashboard: DashboardTypes.DashboardType,
    userId: string,
    requiredPermission: DashboardTypes.DashboardSharePermission = 'viewer'
  ): boolean {
    if (dashboard.userId === userId) {
      return true;
    }

    const collaborator = dashboard.sharedWith?.find((sharedUser) => sharedUser.userId === userId);
    if (!collaborator) {
      return false;
    }
    if (collaborator.status && collaborator.status !== 'accepted') {
      return false;
    }

    return requiredPermission === 'viewer' || collaborator.permission === 'editor';
  }

  private getCollaboratorMetadata(
    dashboard: DashboardTypes.DashboardType,
    userId: string
  ): Pick<DashboardTypes.DashboardType, 'currentUserRole' | 'shareStatus' | 'isExternal'> {
    if (dashboard.userId === userId) {
      return { currentUserRole: 'owner', shareStatus: 'accepted', isExternal: false };
    }
    const collaborator = dashboard.sharedWith?.find((sharedUser) => sharedUser.userId === userId);
    return {
      currentUserRole: collaborator?.permission,
      shareStatus: collaborator?.status || 'accepted',
      isExternal: true
    };
  }

  private async enrichRows(
    dashboards: DashboardTypes.DashboardType[] | undefined,
    requesterUserId: string
  ): Promise<DashboardTypes.DashboardType[]> {
    if (!dashboards) {
      return [];
    }

    const ownerIds = Array.from(new Set(
      dashboards
        .map((dashboard) => dashboard.userId)
        .filter((userId): userId is string => Boolean(userId))
    ));
    const owners = ownerIds.length > 0
      ? await this.dbaccInstance.Auth.findUsersByIds(ownerIds).catch(() => [])
      : [];
    const ownersById = new Map(owners.map((owner) => [owner._id.toString(), owner]));

    return dashboards.map((dashboard) => {
      const plainDashboard = typeof (dashboard as unknown as { toObject?: () => DashboardTypes.DashboardType }).toObject === 'function'
        ? (dashboard as unknown as { toObject: () => DashboardTypes.DashboardType }).toObject()
        : dashboard;
      const owner = dashboard.userId ? ownersById.get(dashboard.userId) : undefined;
      return {
        ...plainDashboard,
        ownerEmail: owner?.email,
        ownerName: owner?.name,
        ...this.getCollaboratorMetadata(dashboard, requesterUserId)
      };
    });
  }

  private async hydrateVisualizations(
    dashboard: DashboardTypes.DashboardType,
    ownerUserId: string
  ): Promise<DashboardTypes.DashboardType> {
    const visualizationsData: VisualizationTypes.VisualizationType[] = [];
    const { visualizations, projectName } = dashboard;
    if (!visualizations || Array.isArray(visualizations)) {
      return dashboard;
    }

    const visualizationRows = await Promise.all(Object.keys(visualizations).map(async (vis) => {
      const splittedVis = vis.split('_');
      return Factory.getInstance()
        .getBZL()
        .VisualizationBZL
        .findOne({
          userId: ownerUserId,
          type: (visualizations as { [name: string]: string })[vis],
          projectName,
          name: splittedVis.slice(0, splittedVis.length - 1).join('_')
        });
    }));

    visualizationsData.push(...visualizationRows);

    dashboard.visualizations = visualizationsData;
    return dashboard;
  }

  async create(dashboard: DashboardTypes.DashboardCreate): Promise<DashboardTypes.DashboardType> {
    const projectBZL = Factory.getInstance().getBZL().ProjectBZL;
    const userId = resolveUserId(dashboard.userId);

    const { projects } = await projectBZL.browse({ userId, isActive: true } as ProjectTypes.ProjectFilter);

    if (!projects || projects.length === 0) {
      throw new Error('No active project');
    }

    const projectName = projects[0].name;

    try {
      return await this.dbaccInstance.Dashboard.create({ ...dashboard, userId, projectName });
    } catch (err) {
      throw new DuplicatedElementError(
        `There already is a Dashboard named ${dashboard.name}`
      );
    }
  }

  async findOne(
    filter: DashboardTypes.DashboardFilter,
    fullVisualizations: boolean = false
  ): Promise<DashboardTypes.DashboardType> {
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
    const queryFilter: UtilTypes.ExtendedMongoQuery = this.dbaccInstance.Dashboard.createFilter(updatedFilter);
    const foundDashboard = await this.dbaccInstance.Dashboard.findOne(queryFilter);
    if (!foundDashboard) {
      logger.error(`No Dashboard was found with name ${filter.name}`);
      throw new NoDataFoundError(
        `No Dashboard was found with name ${filter.name}`
      );
    } else if (fullVisualizations) {
      await this.hydrateVisualizations(foundDashboard, userId);
    }
    return foundDashboard;
  }

  async findShared(
    shareId: string,
    requesterUserId: string,
    fullVisualizations: boolean = false
  ): Promise<DashboardTypes.DashboardType> {
    const queryFilter = this.dbaccInstance.Dashboard.createFilter({ shareId });
    const foundDashboard = await this.dbaccInstance.Dashboard.findOneWithSharing(queryFilter);
    if (!foundDashboard || !this.hasSharedAccess(foundDashboard, requesterUserId, 'viewer')) {
      throw new NoDataFoundError('Shared dashboard was not found');
    }

    if (fullVisualizations) {
      await this.hydrateVisualizations(foundDashboard, resolveUserId(foundDashboard.userId));
    }

    const owner = foundDashboard.userId
      ? await this.dbaccInstance.Auth.findUserById(foundDashboard.userId).catch(() => null)
      : null;
    return {
      ...foundDashboard,
      ownerEmail: owner?.email,
      ownerName: owner?.name,
      ...this.getCollaboratorMetadata(foundDashboard, requesterUserId)
    };
  }

  async browse(filter: DashboardTypes.DashboardFilter): Promise<DashboardTypes.ExtendedDashboardType> {
    const projectBZL = Factory.getInstance().getBZL().ProjectBZL;
    const userId = resolveUserId(filter.userId);

    const isExternal = filter.sharedScope === 'external';
    const { projects } = await projectBZL.browse({ userId, isActive: true } as ProjectTypes.ProjectFilter);
    if (!isExternal && (!projects || projects.length === 0)) {
      throw new Error('No active project');
    }
    const updatedFilter: DashboardTypes.DashboardFilter = isExternal
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

    const queryFilter: UtilTypes.ExtendedMongoQuery = this.dbaccInstance.Dashboard.createFilter(updatedFilter);
    const dashboards = await this.dbaccInstance.Dashboard.browse(queryFilter);
    return {
      ...dashboards,
      dashboards: await this.enrichRows(dashboards.dashboards, userId)
    };
  }

  async update(
    filter: DashboardTypes.DashboardFilter,
    dashboard: DashboardTypes.DashboardUpdate
  ): Promise<DashboardTypes.DashboardType | null> {
    if (filter.shareId) {
      const userId = resolveUserId(filter.userId || dashboard.userId);
      const sharedDashboard = await this.findShared(filter.shareId, userId, false);
      if (!this.hasSharedAccess(sharedDashboard, userId, 'editor')) {
        throw new Error('Shared dashboard edit access required');
      }
      const queryFilter = this.dbaccInstance.Dashboard.createFilter({ shareId: filter.shareId });
      const updatedDashboard = await this.dbaccInstance.Dashboard.update(queryFilter, {
        ...dashboard,
        userId: sharedDashboard.userId
      });
      if (updatedDashboard?.shareId) {
        publish({
          resource: 'dashboard',
          shareId: updatedDashboard.shareId,
          action: 'updated',
          updatedAt: new Date().toISOString()
        });
      }
      return updatedDashboard;
    }

    const projectBZL = Factory.getInstance().getBZL().ProjectBZL;
    const userId = resolveUserId(filter.userId || dashboard.userId);

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

    const queryFilter: UtilTypes.ExtendedMongoQuery = this.dbaccInstance.Dashboard.createFilter(updatedFilter);
    const updatedDashboard = !dashboard.visualizations && dashboard.layouts
      ? await this.dbaccInstance.Dashboard.partialUpdate(queryFilter, { ...dashboard, userId })
      : await this.dbaccInstance.Dashboard.update(queryFilter, { ...dashboard, userId });

    if (updatedDashboard?.shareId) {
      publish({
        resource: 'dashboard',
        shareId: updatedDashboard.shareId,
        action: 'updated',
        updatedAt: new Date().toISOString()
      });
    }

    return updatedDashboard;
  }

  async share(
    filter: DashboardTypes.DashboardFilter,
    collaborators: DashboardTypes.DashboardShareRequest['collaborators']
  ): Promise<DashboardTypes.DashboardType> {
    const userId = resolveUserId(filter.userId);
    const dashboard = await this.findOne(filter, false);
    const owner = await this.dbaccInstance.Auth.findUserById(userId);
    const normalizedCollaborators = normalizeShareCollaborators<DashboardTypes.DashboardSharePermission>(
      collaborators,
      owner?.email,
      'dashboard'
    );
    const existingShareId = dashboard.shareId || createDashboardShareId();
    const existingSharedWith = dashboard.sharedWith || [];
    const now = new Date();
    const expiresAt = new Date(now.getTime() + getInviteTtlMs());
    const sharedWith = await Promise.all(normalizedCollaborators.map(async (collaborator) => {
      const user = await this.dbaccInstance.Auth.findUserByEmailNormalized(collaborator.email);
      if (!user) {
        throw new NoDataFoundError(`No user was found for ${collaborator.email}`);
      }

      const previous = existingSharedWith.find((sharedUser) => sharedUser.userId === user._id.toString());
      return {
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        permission: collaborator.permission === 'editor' ? 'editor' : 'viewer',
        status: 'pending',
        inviteToken: createInviteToken(),
        inviteExpiresAt: expiresAt,
        createdAt: previous?.createdAt || now,
        updatedAt: now
      } as DashboardTypes.DashboardSharedUser;
    }));
    const mergedSharedWith = [
      ...existingSharedWith.filter((existing) => !sharedWith.some((next) => next.userId === existing.userId)),
      ...sharedWith
    ];

    const projectBZL = Factory.getInstance().getBZL().ProjectBZL;
    const { projects } = await projectBZL.browse({ userId, isActive: true } as ProjectTypes.ProjectFilter);
    if (!projects || projects.length === 0) {
      throw new Error('No active project');
    }

    const queryFilter = this.dbaccInstance.Dashboard.createFilter({
      userId,
      projectName: projects[0].name,
      name: filter.name
    });
    const updatedDashboard = await this.dbaccInstance.Dashboard.updateSharing(queryFilter, {
      shareId: existingShareId,
      sharedWith: mergedSharedWith
    });
    if (!updatedDashboard) {
      throw new NoDataFoundError('Dashboard was not found');
    }
    publish({
      resource: 'dashboard',
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
        resourceType: 'dashboard',
        resourceName: dashboard.name,
        permission: sharedUser.permission,
        token: sharedUser.inviteToken,
        expiresAt: sharedUser.inviteExpiresAt
      }).catch((error) => logger.warn('Unable to send dashboard share invitation email', error));
    });
    return updatedDashboard;
  }

  async revokeShare(
    filter: DashboardTypes.DashboardFilter,
    sharedUserId: string
  ): Promise<DashboardTypes.DashboardType> {
    const userId = resolveUserId(filter.userId);
    const dashboard = await this.findOne(filter, false);
    if (!dashboard.shareId) {
      throw new NoDataFoundError('Dashboard is not shared');
    }

    const revokedUser = (dashboard.sharedWith || []).find((sharedUser) => sharedUser.userId === sharedUserId);
    if (!revokedUser) {
      throw new NoDataFoundError('Shared user was not found');
    }

    const owner = await this.dbaccInstance.Auth.findUserById(userId);
    const nextSharedWith = (dashboard.sharedWith || []).filter((sharedUser) => sharedUser.userId !== sharedUserId);
    const projectBZL = Factory.getInstance().getBZL().ProjectBZL;
    const { projects } = await projectBZL.browse({ userId, isActive: true } as ProjectTypes.ProjectFilter);
    if (!projects || projects.length === 0) {
      throw new Error('No active project');
    }

    const updatedDashboard = await this.dbaccInstance.Dashboard.updateSharing(
      this.dbaccInstance.Dashboard.createFilter({
        userId,
        projectName: projects[0].name,
        name: filter.name
      }),
      {
        shareId: dashboard.shareId,
        sharedWith: nextSharedWith
      }
    );
    if (!updatedDashboard) {
      throw new NoDataFoundError('Dashboard was not found');
    }

    publish({
      resource: 'dashboard',
      shareId: dashboard.shareId,
      action: 'shared',
      updatedAt: new Date().toISOString()
    });

    if (revokedUser.email) {
      void new EmailService().sendShareRevocationEmail({
        email: revokedUser.email,
        ownerName: owner?.name || 'A teammate',
        resourceType: 'dashboard',
        resourceName: dashboard.name
      }).catch((error) => logger.warn('Unable to send dashboard share revocation email', error));
    }

    return updatedDashboard;
  }

  async respondToInvite(token: string, decision: 'accept' | 'reject'): Promise<DashboardTypes.DashboardType> {
    const dashboard = await this.dbaccInstance.Dashboard.findOneByShareInviteToken(token);
    if (!dashboard) {
      throw new NoDataFoundError('Share invitation was not found');
    }
    const now = new Date();
    const sharedWith = (dashboard.sharedWith || []).map((sharedUser) => {
      if (sharedUser.inviteToken !== token) {
        return sharedUser;
      }
      if (sharedUser.inviteExpiresAt && new Date(sharedUser.inviteExpiresAt).getTime() < now.getTime()) {
        throw new NoDataFoundError('Share invitation expired');
      }
      return {
        ...sharedUser,
        status: (decision === 'accept' ? 'accepted' : 'rejected') as DashboardTypes.DashboardShareStatus,
        respondedAt: now,
        updatedAt: now
      };
    });
    const updatedDashboard = await this.dbaccInstance.Dashboard.updateSharing(
      this.dbaccInstance.Dashboard.createFilter({ shareId: dashboard.shareId }),
      { shareId: dashboard.shareId, sharedWith }
    );
    if (!updatedDashboard) {
      throw new NoDataFoundError('Dashboard was not found');
    }
    return updatedDashboard;
  }

  async delete(filter: DashboardTypes.DashboardFilter): Promise<boolean> {
    const projectBZL = Factory.getInstance().getBZL().ProjectBZL;
    const userId = resolveUserId(filter.userId);

    if (filter.shareId) {
      const sharedDashboard = await this.findShared(filter.shareId, userId, false);
      if (sharedDashboard.userId !== userId) {
        const nextSharedWith = (sharedDashboard.sharedWith || []).filter((sharedUser) => sharedUser.userId !== userId);
        await this.dbaccInstance.Dashboard.updateSharing(
          this.dbaccInstance.Dashboard.createFilter({ shareId: filter.shareId }),
          { shareId: filter.shareId, sharedWith: nextSharedWith }
        );
        publish({
          resource: 'dashboard',
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

    const queryFilter: UtilTypes.ExtendedMongoQuery = this.dbaccInstance.Dashboard.createFilter(updatedFilter);

    const deletedShareId = filter.shareId || (await this.dbaccInstance.Dashboard.findOneWithSharing(queryFilter))?.shareId;
    await Promise.resolve(this.dbaccInstance.Dashboard.delete(queryFilter));
    if (deletedShareId) {
      publish({
        resource: 'dashboard',
        shareId: deletedShareId,
        action: 'deleted',
        updatedAt: new Date().toISOString()
      });
    }
    return true;
  }
}

export default DashboardBZL;
