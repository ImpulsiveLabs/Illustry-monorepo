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
    } else {
      const visualizationsData: VisualizationTypes.VisualizationType[] = [];
      const { visualizations, projectName } = foundDashboard;
      if (visualizations && fullVisualizations) {
        // eslint-disable-next-line no-restricted-syntax
        for (const vis of Object.keys(visualizations)) {
          const splittedVis = vis.split('_');
          // eslint-disable-next-line no-await-in-loop
          const visualizationData = await Factory.getInstance()
            .getBZL()
            .VisualizationBZL
            .findOne({
              userId,
              type: (visualizations as { [name: string]: string })[vis],
              projectName,
              name: splittedVis.slice(0, splittedVis.length - 1).join('_')
            });

          visualizationsData.push(visualizationData);
        }

        foundDashboard.visualizations = visualizationsData;
      }
    }
    return foundDashboard;
  }

  async browse(filter: DashboardTypes.DashboardFilter): Promise<DashboardTypes.ExtendedDashboardType> {
    const projectBZL = Factory.getInstance().getBZL().ProjectBZL;
    const userId = resolveUserId(filter.userId);

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
    const dashboards = await this.dbaccInstance.Dashboard.browse(queryFilter);
    return dashboards;
  }

  async update(
    filter: DashboardTypes.DashboardFilter,
    dashboard: DashboardTypes.DashboardUpdate
  ): Promise<DashboardTypes.DashboardType | null> {
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
    if (!dashboard.visualizations && dashboard.layouts) {
      return this.dbaccInstance.Dashboard.partialUpdate(queryFilter, { ...dashboard, userId });
    }
    return this.dbaccInstance.Dashboard.update(queryFilter, { ...dashboard, userId });
  }

  async delete(filter: DashboardTypes.DashboardFilter): Promise<boolean> {
    const projectBZL = Factory.getInstance().getBZL().ProjectBZL;
    const userId = resolveUserId(filter.userId);

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

    await Promise.resolve(this.dbaccInstance.Dashboard.delete(queryFilter));
    return true;
  }
}

export default DashboardBZL;
