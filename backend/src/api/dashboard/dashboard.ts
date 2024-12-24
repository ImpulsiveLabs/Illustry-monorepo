import { NextFunction, Request, Response } from 'express';
import { DashboardTypes, ValidatorSchemas } from '@illustry/types';
import Factory from '../../factory';
import { returnResponse } from '../../utils/helper';

const create = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      name,
      description,
      visualizations
    } = request.body;

    const dashboard: DashboardTypes.DashboardUpdate = {
      name,
      description,
      visualizations
    };

    ValidatorSchemas.validateWithSchema<DashboardTypes.DashboardUpdate>(ValidatorSchemas.dashboardUpdateSchema, dashboard);

    await Factory.getInstance().getBZL().DashboardBZL.create(dashboard as DashboardTypes.DashboardCreate);

    returnResponse(response, null, { dashboard }, next);
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
    const {
      name,
      description,
      visualizations,
      layouts
    } = request.body;

    const dashboardFilter: DashboardTypes.DashboardFilter = {
      name
    };

    const dashboard: DashboardTypes.DashboardUpdate = {
      description,
      visualizations,
      layouts
    };

    ValidatorSchemas.validateWithSchema<DashboardTypes.DashboardUpdate>(ValidatorSchemas.dashboardUpdateSchema, dashboard);
    ValidatorSchemas.validateWithSchema<DashboardTypes.DashboardFilter>(ValidatorSchemas.dashboardFilterSchema, dashboardFilter);
    const data = await Factory.getInstance()
      .getBZL()
      .DashboardBZL
      .update(dashboardFilter, dashboard);

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
    const { params: { name } } = request;
    const { fullVisualizations } = request.body;
    const dashboardFilter: DashboardTypes.DashboardFilter = {
      name
    };
    ValidatorSchemas.validateWithSchema<DashboardTypes.DashboardFilter>(ValidatorSchemas.dashboardFilterSchema, dashboardFilter);

    const data = await Factory.getInstance()
      .getBZL()
      .DashboardBZL
      .findOne(dashboardFilter, fullVisualizations);

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
    const {
      name
    } = request.body;

    const dashboardFilter: DashboardTypes.DashboardFilter = {
      name
    };

    ValidatorSchemas.validateWithSchema<DashboardTypes.DashboardFilter>(ValidatorSchemas.dashboardFilterSchema, dashboardFilter);

    const data = await Factory.getInstance()
      .getBZL()
      .DashboardBZL
      .delete(dashboardFilter);

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
    const {
      name,
      text,
      page,
      sort,
      per_page: perPage
    } = request.body;

    const dashboardFilter: DashboardTypes.DashboardFilter = {
      name,
      text,
      page,
      sort,
      per_page: perPage
    };

    ValidatorSchemas.validateWithSchema<DashboardTypes.DashboardFilter>(ValidatorSchemas.dashboardFilterSchema, dashboardFilter);

    const data = await Factory.getInstance()
      .getBZL()
      .DashboardBZL
      .browse(dashboardFilter);

    returnResponse(response, null, data, next);
  } catch (err) {
    returnResponse(response, (err as Error), null, next);
  }
};

export {
  create, update, findOne, _delete, browse
};
