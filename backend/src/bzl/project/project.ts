import {
  ProjectTypes,
  UtilTypes,
  GenericTypes
} from '@illustry/types';
import DbaccInstance from '../../dbacc/lib';
import NoDataFoundError from '../../errors/noDataFoundError';
import logger from '../../config/logger';
import DuplicatedElementError from '../../errors/duplicatedElementError';
import { resolveUserId } from '../user-scope';
import { publish } from '../../realtime/broker';

class ProjectBZL implements GenericTypes.BaseBZL<
  ProjectTypes.ProjectCreate,
  ProjectTypes.ProjectUpdate,
  ProjectTypes.ProjectFilter,
  ProjectTypes.ProjectType,
  ProjectTypes.ExtendedProjectType> {
  private dbaccInstance: DbaccInstance;

  constructor(dbaccInstance: DbaccInstance) {
    this.dbaccInstance = dbaccInstance;
  }

  async create(project: ProjectTypes.ProjectCreate): Promise<ProjectTypes.ProjectType> {
    const scopedProject = { ...project, userId: resolveUserId(project.userId) };

    try {
      const createdProject = await this.dbaccInstance.Project.create(scopedProject);
      publish({
        resource: 'project',
        shareId: scopedProject.userId,
        action: 'created',
        updatedAt: new Date().toISOString()
      });
      return createdProject;
    } catch {
      throw new DuplicatedElementError(
        `There already is a project named ${project.name}`
      );
    }
  }

  async findOne(filter: ProjectTypes.ProjectFilter): Promise<ProjectTypes.ProjectType> {
    const scopedFilter = { ...(filter || {}), userId: resolveUserId(filter?.userId) };
    const newFilter: UtilTypes.ExtendedMongoQuery = this.dbaccInstance.Project.createFilter(scopedFilter);
    const foundProject = await this.dbaccInstance.Project.findOne(newFilter);
    if (!foundProject) {
      logger.error(`No project was found with name ${filter.name}`);
      throw new NoDataFoundError(
        `No project was found with name ${filter.name}`
      );
    } else {
      return foundProject;
    }
  }

  async browse(filter: ProjectTypes.ProjectFilter): Promise<ProjectTypes.ExtendedProjectType> {
    const scopedFilter = { ...(filter || {}), userId: resolveUserId(filter?.userId) };
    const newFilter: UtilTypes.ExtendedMongoQuery = this.dbaccInstance.Project.createFilter(scopedFilter);
    const projects = await this.dbaccInstance.Project.browse(newFilter);
    return projects;
  }

  async update(
    filter: ProjectTypes.ProjectFilter,
    project: ProjectTypes.ProjectUpdate
  ): Promise<ProjectTypes.ProjectType | null> {
    const userId = resolveUserId(filter?.userId || project?.userId);
    const scopedFilter = { ...(filter || {}), userId };
    const newFilter: UtilTypes.ExtendedMongoQuery = this.dbaccInstance.Project.createFilter(scopedFilter);
    await this.findOne(scopedFilter);
    const updatedProject = await this.dbaccInstance.Project.update(newFilter, { ...project, userId });
    publish({
      resource: 'project',
      shareId: userId,
      action: 'updated',
      updatedAt: new Date().toISOString()
    });
    return updatedProject;
  }

  async delete(filter: ProjectTypes.ProjectFilter): Promise<boolean> {
    const userId = resolveUserId(filter?.userId);
    let newProjectFilter: UtilTypes.ExtendedMongoQuery = {};
    let newVisualizationFilter: UtilTypes.ExtendedMongoQuery = {};
    let newDashboardFilter: UtilTypes.ExtendedMongoQuery = {};
    if (filter) {
      newProjectFilter = this.dbaccInstance.Project.createFilter({ ...filter, userId });
      newVisualizationFilter = this.dbaccInstance.Visualization.createFilter({
        userId,
        projectName: filter.name
      });
      newDashboardFilter = this.dbaccInstance.Dashboard.createFilter({
        userId,
        projectName: filter.name
      });
    }
    await this.findOne({ ...(filter || {}), userId });
    await Promise.all([
      Promise.resolve(this.dbaccInstance.Visualization.deleteMany(newVisualizationFilter)),
      Promise.resolve(this.dbaccInstance.Dashboard.deleteMany(newDashboardFilter))
    ]);
    const deleted = await Promise.resolve(this.dbaccInstance.Project.delete(newProjectFilter));
    publish({
      resource: 'project',
      shareId: userId,
      action: 'deleted',
      updatedAt: new Date().toISOString()
    });

    return deleted;
  }
}

export default ProjectBZL;
