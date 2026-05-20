import { NextFunction, Request, Response } from 'express';
import { FileTypes, VisualizationTypes, ValidatorSchemas } from '@illustry/types';
import { returnResponse } from '../../utils/helper';
import FileError from '../../errors/fileError';
import Factory from '../../factory';

const getAuthenticatedUserId = (request: Request): string => {
  const userId = request.auth?.userId;
  if (userId === undefined) {
    throw new Error('Authentication required');
  }

  return userId;
};

const createOrUpdate = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(request);
    let requestFiles: FileTypes.UploadedFile[] = [];
    if (request && (request as FileTypes.RequestWithFiles).files) {
      const { files: { file } } = request as FileTypes.RequestWithFiles;
      requestFiles = file;
    }
    if (!requestFiles) {
      return returnResponse(
        response,
        new FileError('No files uploaded'),
        null,
        next
      );
    }

    const computedFiles: FileTypes.FileProperties[] = requestFiles.map((f) => ({
      filePath: f.path,
      type: f.mimetype
    }));

    const { fileDetails: reqFDet, visualizationDetails: reqVisDet, fullDetails } = request.body;

    let fileDetails;
    let visualizationDetails;

    if (reqFDet) {
      fileDetails = JSON.parse(reqFDet);
    }

    if (reqVisDet) {
      visualizationDetails = JSON.parse(reqVisDet);
    }

    const allFileDetails = fullDetails === 'true';
    const data = await Factory.getInstance()
      .getBZL()
      .VisualizationBZL.createOrUpdateFromFiles(
        computedFiles,
        allFileDetails,
        visualizationDetails,
        fileDetails,
        userId
      );

    return returnResponse(response, null, data, next);
  } catch (err) {
    return returnResponse(response, (err as Error), null, next);
  }
};

const findOne = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(request);
    const { params: { name }, body: { type } } = request;

    const visualizationFilter: VisualizationTypes.VisualizationFilter = {
      userId,
      name,
      type
    };

    ValidatorSchemas.validateWithSchema<
      VisualizationTypes.VisualizationFilter
    >(ValidatorSchemas.visualizationFilterSchema, visualizationFilter);

    const data = await Factory.getInstance()
      .getBZL()
      .VisualizationBZL.findOne(visualizationFilter);

    return returnResponse(response, null, data, next);
  } catch (err) {
    return returnResponse(response, (err as Error), null, next);
  }
};

const findShared = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(request);
    const { shareId } = request.params;

    const data = await Factory.getInstance()
      .getBZL()
      .VisualizationBZL
      .findShared(shareId, userId);

    return returnResponse(response, null, data, next);
  } catch (err) {
    return returnResponse(response, (err as Error), null, next);
  }
};

const findSharedThroughDashboard = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(request);
    const { dashboardShareId } = request.params;
    const { name, type } = request.query;

    if (typeof name !== 'string' || typeof type !== 'string') {
      throw new Error('Visualization name and type are required');
    }

    const data = await Factory.getInstance()
      .getBZL()
      .VisualizationBZL
      .findSharedThroughDashboard(dashboardShareId, name, type, userId);

    return returnResponse(response, null, data, next);
  } catch (err) {
    return returnResponse(response, (err as Error), null, next);
  }
};

const share = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(request);
    const {
      name, type, shareId, collaborators, theme
    } = request.body as VisualizationTypes.VisualizationShareRequest;

    const visualizationFilter: VisualizationTypes.VisualizationFilter = {
      userId,
      shareId,
      name,
      type
    };

    ValidatorSchemas.validateWithSchema<
      VisualizationTypes.VisualizationFilter
    >(ValidatorSchemas.visualizationFilterSchema, visualizationFilter);

    const data = await Factory.getInstance()
      .getBZL()
      .VisualizationBZL
      .share(visualizationFilter, collaborators || [], theme);

    return returnResponse(response, null, data, next);
  } catch (err) {
    return returnResponse(response, (err as Error), null, next);
  }
};

const revokeShare = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(request);
    const {
      name, type, shareId, userId: sharedUserId
    } = request.body as VisualizationTypes.VisualizationShareRevokeRequest;

    if (!sharedUserId) {
      throw new Error('Shared user is required');
    }

    const visualizationFilter: VisualizationTypes.VisualizationFilter = {
      userId,
      shareId,
      name,
      type
    };

    ValidatorSchemas.validateWithSchema<
      VisualizationTypes.VisualizationFilter
    >(ValidatorSchemas.visualizationFilterSchema, visualizationFilter);

    const data = await Factory.getInstance()
      .getBZL()
      .VisualizationBZL
      .revokeShare(visualizationFilter, sharedUserId);

    return returnResponse(response, null, data, next);
  } catch (err) {
    return returnResponse(response, (err as Error), null, next);
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
      name, type, shareId, theme, realtimeClientId
    } = request.body as VisualizationTypes.VisualizationUpdate & { realtimeClientId?: string };

    const visualizationFilter: VisualizationTypes.VisualizationFilter = {
      userId,
      shareId,
      name: name as string | undefined,
      type: type as string | undefined
    };

    ValidatorSchemas.validateWithSchema<
    VisualizationTypes.VisualizationFilter
    >(ValidatorSchemas.visualizationFilterSchema, visualizationFilter);

    const data = await Factory.getInstance()
      .getBZL()
      .VisualizationBZL
      .update(visualizationFilter, { theme }, realtimeClientId as string | undefined);

    return returnResponse(response, null, data, next);
  } catch (err) {
    return returnResponse(response, (err as Error), null, next);
  }
};

const respondToShareInvite = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, decision } = request.body as VisualizationTypes.VisualizationShareInviteDecision;

    if (typeof token !== 'string' || (decision !== 'accept' && decision !== 'reject')) {
      throw new Error('Invalid share invite payload');
    }

    const data = await Factory.getInstance()
      .getBZL()
      .VisualizationBZL
      .respondToInvite(token, decision);

    returnResponse(response, null, data, next);
  } catch (err) {
    returnResponse(response, (err as Error), null, next);
  }
};

const syncTheme = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(request);
    const { theme, realtimeClientId } = request.body as VisualizationTypes.VisualizationThemeSyncRequest & {
      realtimeClientId?: string;
    };

    if (!theme || typeof theme !== 'object' || Array.isArray(theme)) {
      throw new Error('A valid theme payload is required');
    }

    const data = await Factory.getInstance()
      .getBZL()
      .VisualizationBZL
      .syncEditableSharedThemes(userId, theme, realtimeClientId);

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
      body: {
        text, page, sort, sharedScope, per_page: perPage
      }
    } = request;

    const visualizationFilter: VisualizationTypes.VisualizationFilter = {
      userId,
      text,
      sharedScope,
      page,
      sort,
      per_page: perPage
    };

    ValidatorSchemas.validateWithSchema<
    VisualizationTypes.VisualizationFilter
    >(ValidatorSchemas.visualizationFilterSchema, visualizationFilter);

    const data = await Factory.getInstance()
      .getBZL()
      .VisualizationBZL.browse(visualizationFilter);

    return returnResponse(response, null, data, next);
  } catch (err) {
    return returnResponse(response, (err as Error), null, next);
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
      body: {
        name, type, projectName, shareId, realtimeClientId
      }
    } = request;

    const visualizationFilter: VisualizationTypes.VisualizationFilter = {
      userId,
      shareId,
      name,
      type,
      projectName
    };

    ValidatorSchemas.validateWithSchema<
    VisualizationTypes.VisualizationFilter
    >(ValidatorSchemas.visualizationFilterSchema, visualizationFilter);

    const data = await Factory.getInstance()
      .getBZL()
      .VisualizationBZL.delete(visualizationFilter, realtimeClientId);

    return returnResponse(response, null, data, next);
  } catch (err) {
    return returnResponse(response, (err as Error), null, next);
  }
};

const createOrUpdateExternal = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(request);
    const {
      data
    } = request.body;

    const visualizations = Array.isArray(data)
      ? data
      : [data];
    const createdVisualizations = await Promise.all(
      visualizations.map(async (visualizationData) => {
        const visualization: VisualizationTypes.VisualizationCreate = {
          userId,
          name: visualizationData.name,
          data: visualizationData.data,
          projectName: visualizationData.projectName,
          type: visualizationData.type,
          description: visualizationData.description,
          tags: visualizationData.tags,
          theme: visualizationData.theme,
        };
        ValidatorSchemas.validateWithSchema<
        VisualizationTypes.VisualizationCreate
      >(ValidatorSchemas.visualizationTypeSchema, visualization)
        return Factory.getInstance().getBZL().VisualizationBZL.createOrUpdate(visualization as VisualizationTypes.VisualizationCreate);
      })
    );

    returnResponse(response, null, createdVisualizations.length === 1 ? createdVisualizations[0] : createdVisualizations, next);
  } catch (err) {
    returnResponse(response, (err as Error), null, next);
  }
};

export {
  createOrUpdate,
  update,
  findOne,
  findShared,
  findSharedThroughDashboard,
  share,
  revokeShare,
  syncTheme,
  respondToShareInvite,
  browse,
  _delete,
  createOrUpdateExternal
};
