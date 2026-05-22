import { NextFunction, Request, Response } from 'express';
import { DashboardTypes, ValidatorSchemas } from '@illustry/types';
import Factory from '../../factory';
import { returnResponse } from '../../utils/helper';
import { createDashboardExcelWorkbook, EXCEL_MIME } from '../../utils/excel-export';
import {
  createDashboardExportBundle,
  type ExportChartPayload,
  type ExportFormat
} from '../../utils/export-bundle';

const getAuthenticatedUserId = (request: Request): string => {
  const userId = request.auth?.userId;
  if (userId === undefined) {
    throw new Error('Authentication required');
  }

  return userId;
};

const getExportRequestBody = (request: Request) => {
  if (typeof request.body?.payload === 'string') {
    return JSON.parse(request.body.payload) as Record<string, unknown>;
  }
  return request.body as Record<string, unknown>;
};

const normalizeUploadedTemplateFile = (file?: Express.Multer.File) => {
  if (!file?.buffer?.length) {
    return undefined;
  }
  return {
    buffer: file.buffer,
    originalname: file.originalname,
    mimetype: file.mimetype
  };
};

const getUploadedTemplateFiles = (request: Request) => {
  const filesByField = request.files && !Array.isArray(request.files)
    ? request.files as Record<string, Express.Multer.File[]>
    : {};
  const file = request.file;
  return {
    excel: normalizeUploadedTemplateFile(filesByField.templateExcel?.[0]),
    pdf: normalizeUploadedTemplateFile(filesByField.templatePdf?.[0]),
    word: normalizeUploadedTemplateFile(filesByField.templateWord?.[0]),
    ppt: normalizeUploadedTemplateFile(filesByField.templatePpt?.[0]),
    fallback: normalizeUploadedTemplateFile(filesByField.templateFile?.[0] || file)
  };
};

const create = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(request);
    const {
      name,
      description,
      visualizations
    } = request.body;

    const dashboard: DashboardTypes.DashboardUpdate = {
      userId,
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
    const userId = getAuthenticatedUserId(request);
    const {
      name,
      shareId,
      description,
      visualizations,
      layouts,
      realtimeClientId
    } = request.body;

    const dashboardFilter: DashboardTypes.DashboardFilter = {
      userId,
      shareId,
      name
    };

    const dashboard: DashboardTypes.DashboardUpdate = {
      userId,
      description,
      visualizations,
      layouts
    };

    ValidatorSchemas.validateWithSchema<DashboardTypes.DashboardUpdate>(ValidatorSchemas.dashboardUpdateSchema, dashboard);
    ValidatorSchemas.validateWithSchema<DashboardTypes.DashboardFilter>(ValidatorSchemas.dashboardFilterSchema, dashboardFilter);
    const data = await Factory.getInstance()
      .getBZL()
      .DashboardBZL
      .update(dashboardFilter, dashboard, realtimeClientId);

    returnResponse(response, null, data, next);
  } catch (err) {
    returnResponse(response, (err as Error), null, next);
  }
};

const exportExcel = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(request);
    const {
      name,
      shareId,
      sheetName,
      cellRange,
      templateWorkbookBase64,
      templateWorkbookFilename
    } = getExportRequestBody(request) as DashboardTypes.DashboardFilter & {
      sheetName?: string;
      cellRange?: string;
      templateWorkbookBase64?: string;
      templateWorkbookFilename?: string;
    };

    const dashboard = shareId
      ? await Factory.getInstance()
        .getBZL()
        .DashboardBZL
        .findShared(shareId, userId, true)
      : await Factory.getInstance()
        .getBZL()
        .DashboardBZL
        .findOne({ userId, name }, true);

    const workbook = await createDashboardExcelWorkbook(dashboard, {
      sheetName,
      cellRange,
      templateWorkbookBase64,
      templateWorkbookFilename
    });

    response.setHeader('Content-Type', EXCEL_MIME);
    response.setHeader('Content-Disposition', `attachment; filename="${workbook.filename}"`);
    response.send(workbook.buffer);
  } catch (err) {
    returnResponse(response, (err as Error), null, next);
  }
};

const exportBundle = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(request);
    const {
      name,
      shareId,
      sheetName,
      cellRange,
      templateWorkbookBase64,
      templateWorkbookFilename,
      formats,
      charts,
      previewDataUrl,
      documentOptions,
      title
    } = getExportRequestBody(request) as DashboardTypes.DashboardFilter & {
      sheetName?: string;
      cellRange?: string;
      templateWorkbookBase64?: string;
      templateWorkbookFilename?: string;
      formats?: ExportFormat[];
      charts?: ExportChartPayload[];
      previewDataUrl?: string;
      documentOptions?: {
        page?: number;
        width?: number;
        height?: number;
        placement?: string;
      };
      title?: string;
    };
    const uploadedTemplateFiles = getUploadedTemplateFiles(request);

    const dashboard = shareId
      ? await Factory.getInstance()
        .getBZL()
        .DashboardBZL
        .findShared(shareId, userId, true)
      : await Factory.getInstance()
        .getBZL()
        .DashboardBZL
        .findOne({ userId, name }, true);

    const bundle = await createDashboardExportBundle({
      title: title || dashboard.name || name || 'Illustry dashboard',
      formats: formats || [],
      charts: charts || [],
      previewDataUrl,
      excelOptions: {
        sheetName,
        cellRange,
        templateWorkbookBase64,
        templateWorkbookFilename
      },
      documentOptions: uploadedTemplateFiles.fallback
        || uploadedTemplateFiles.excel
        || uploadedTemplateFiles.pdf
        || uploadedTemplateFiles.word
        || uploadedTemplateFiles.ppt
        ? {
          ...documentOptions,
          templateFile: uploadedTemplateFiles.fallback,
          templateFiles: {
            excel: uploadedTemplateFiles.excel,
            pdf: uploadedTemplateFiles.pdf,
            word: uploadedTemplateFiles.word,
            ppt: uploadedTemplateFiles.ppt
          }
        }
        : documentOptions,
      dashboard
    });

    response.setHeader('Content-Type', bundle.mimeType);
    response.setHeader('Content-Disposition', `attachment; filename="${bundle.filename}"`);
    response.setHeader('X-Illustry-Bundled', bundle.bundled ? 'true' : 'false');
    response.send(bundle.buffer);
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
    const { fullVisualizations } = request.body;
    const dashboardFilter: DashboardTypes.DashboardFilter = {
      userId,
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

const findShared = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(request);
    const { shareId } = request.params;
    const fullVisualizations = request.query.fullVisualizations === 'true'
      || request.body?.fullVisualizations === true;

    const data = await Factory.getInstance()
      .getBZL()
      .DashboardBZL
      .findShared(shareId, userId, fullVisualizations);

    returnResponse(response, null, data, next);
  } catch (err) {
    returnResponse(response, (err as Error), null, next);
  }
};

const share = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(request);
    const { name, collaborators } = request.body as DashboardTypes.DashboardShareRequest;
    const dashboardFilter: DashboardTypes.DashboardFilter = {
      userId,
      name
    };

    ValidatorSchemas.validateWithSchema<DashboardTypes.DashboardFilter>(ValidatorSchemas.dashboardFilterSchema, dashboardFilter);

    const data = await Factory.getInstance()
      .getBZL()
      .DashboardBZL
      .share(dashboardFilter, collaborators || []);

    returnResponse(response, null, data, next);
  } catch (err) {
    returnResponse(response, (err as Error), null, next);
  }
};

const revokeShare = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(request);
    const { name, shareId, userId: sharedUserId } = request.body as DashboardTypes.DashboardShareRevokeRequest;
    if (!sharedUserId) {
      throw new Error('Shared user is required');
    }

    const dashboardFilter: DashboardTypes.DashboardFilter = {
      userId,
      shareId,
      name
    };

    ValidatorSchemas.validateWithSchema<DashboardTypes.DashboardFilter>(ValidatorSchemas.dashboardFilterSchema, dashboardFilter);

    const data = await Factory.getInstance()
      .getBZL()
      .DashboardBZL
      .revokeShare(dashboardFilter, sharedUserId);

    returnResponse(response, null, data, next);
  } catch (err) {
    returnResponse(response, (err as Error), null, next);
  }
};

const respondToShareInvite = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, decision } = request.body as DashboardTypes.DashboardShareInviteDecision;
    const data = await Factory.getInstance()
      .getBZL()
      .DashboardBZL
      .respondToInvite(token, decision);

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
      name,
      shareId,
      realtimeClientId
    } = request.body;

    const dashboardFilter: DashboardTypes.DashboardFilter = {
      userId,
      name,
      shareId
    };

    ValidatorSchemas.validateWithSchema<DashboardTypes.DashboardFilter>(ValidatorSchemas.dashboardFilterSchema, dashboardFilter);

    const data = await Factory.getInstance()
      .getBZL()
      .DashboardBZL
      .delete(dashboardFilter, realtimeClientId);

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
      sharedScope,
      per_page: perPage
    } = request.body;

    const dashboardFilter: DashboardTypes.DashboardFilter = {
      userId,
      name,
      text,
      sharedScope,
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
  create,
  update,
  exportExcel,
  exportBundle,
  findOne,
  findShared,
  share,
  revokeShare,
  respondToShareInvite,
  _delete,
  browse
};
