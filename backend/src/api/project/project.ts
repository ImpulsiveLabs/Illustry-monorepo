import { NextFunction, Request, Response } from 'express';
import { ProjectTypes, VisualizationTypes, ValidatorSchemas } from '@illustry/types';
import Factory from '../../factory';
import { returnResponse } from '../../utils/helper';

const getAuthenticatedUserId = (request: Request): string => {
  const userId = request.auth?.userId;
  if (userId === undefined) {
    throw new Error('Authentication required');
  }

  return userId;
};

const create = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(request);
    const {
      projectName,
      projectDescription,
      isActive,
      name,
      type,
      description,
      tags
    } = request.body;

    const project: ProjectTypes.ProjectCreate = {
      userId,
      name: projectName,
      description: projectDescription,
      isActive
    };
    const visualization: VisualizationTypes.VisualizationCreate = {
      userId,
      name,
      projectName: project.name,
      type,
      description,
      tags
    };

    ValidatorSchemas.validateWithSchema<ProjectTypes.ProjectCreate>(ValidatorSchemas.projectCreateSchema, project);

    const data = await Factory.getInstance().getBZL().ProjectBZL.create(project);

    if (
      visualization.name
      && visualization.type
      && visualization.projectName
    ) {
      ValidatorSchemas.validateWithSchema<
        VisualizationTypes.VisualizationCreate
      >(ValidatorSchemas.visualizationDataSchema, visualization);
      await Factory.getInstance().getBZL().VisualizationBZL.createOrUpdate(visualization);
    }

    returnResponse(response, null, data, next);
  } catch (err) {
    returnResponse(response, (err as Error), null, next);
  }
};

const update = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(request);
    const {
      name,
      description,
      isActive
    } = request.body;

    const projectFilter: ProjectTypes.ProjectFilter = {
      userId,
      name
    };

    const project: ProjectTypes.ProjectUpdate = {
      description,
      isActive
    };

    ValidatorSchemas.validateWithSchema<ProjectTypes.ProjectUpdate>(ValidatorSchemas.projectUpdateSchema, project);
    ValidatorSchemas.validateWithSchema<ProjectTypes.ProjectFilter>(ValidatorSchemas.projectFilterSchema, projectFilter);

    const data = await Factory.getInstance()
      .getBZL()
      .ProjectBZL
      .update(projectFilter, project);

    returnResponse(response, null, data, next);
  } catch (err) {
    returnResponse(response, (err as Error), null, next);
  }
};

const findOne = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(request);
    const { params: { name } } = request;

    const projectFilter: ProjectTypes.ProjectFilter = {
      userId,
      name
    };

    ValidatorSchemas.validateWithSchema<ProjectTypes.ProjectFilter>(ValidatorSchemas.projectFilterSchema, projectFilter);

    const data = await Factory.getInstance()
      .getBZL()
      .ProjectBZL
      .findOne(projectFilter);

    returnResponse(response, null, data, next);
  } catch (err) {
    returnResponse(response, (err as Error), null, next);
  }
};

const _delete = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(request);
    const {
      name
    } = request.body;

    const projectFilter: ProjectTypes.ProjectFilter = {
      userId,
      name
    };

    ValidatorSchemas.validateWithSchema<ProjectTypes.ProjectFilter>(ValidatorSchemas.projectFilterSchema, projectFilter);

    const data = await Factory.getInstance()
      .getBZL()
      .ProjectBZL
      .delete(projectFilter);

    returnResponse(response, null, data, next);
  } catch (err) {
    returnResponse(response, (err as Error), null, next);
  }
};

const browse = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(request);
    const {
      name,
      text,
      page,
      sort,
      per_page: perPage
    } = request.body;

    const projectFilter: ProjectTypes.ProjectFilter = {
      userId,
      name,
      text,
      page,
      sort,
      per_page: perPage
    };

    ValidatorSchemas.validateWithSchema<ProjectTypes.ProjectFilter>(ValidatorSchemas.projectFilterSchema, projectFilter);

    const data = await Factory.getInstance()
      .getBZL()
      .ProjectBZL
      .browse(projectFilter);

    returnResponse(response, null, data, next);
  } catch (err) {
    returnResponse(response, (err as Error), null, next);
  }
};

export {
  create, update, findOne, _delete, browse
};
