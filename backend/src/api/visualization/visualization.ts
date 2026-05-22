import { NextFunction, Request, Response } from 'express';
import { FileTypes, VisualizationTypes, ValidatorSchemas } from '@illustry/types';
import path from 'path';
import { returnResponse } from '../../utils/helper';
import FileError from '../../errors/fileError';
import Factory from '../../factory';
import { createVisualizationExcelWorkbook, EXCEL_MIME } from '../../utils/excel-export';
import {
  createVisualizationExportBundle,
  type ExportChartPayload,
  type ExportFormat
} from '../../utils/export-bundle';
import { createOfficeVisualizationPreview, type OfficeRangePayload } from '../../utils/office-addin';

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

const normalizeSourceFileType = (file: FileTypes.UploadedFile & { originalname?: string }) => {
  const extension = path.extname(file.originalname || '').toLowerCase();
  if (extension === '.xlsx') {
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }
  if (extension === '.csv') {
    return 'text/csv';
  }
  if (extension === '.json') {
    return 'application/json';
  }
  if (extension === '.xml') {
    return 'text/xml';
  }
  return file.mimetype;
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
      type: normalizeSourceFileType(f)
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

const exportExcel = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(request);
    const {
      name,
      type,
      shareId,
      dashboardShareId,
      sheetName,
      cellRange,
      templateWorkbookBase64,
      templateWorkbookFilename
    } = getExportRequestBody(request) as VisualizationTypes.VisualizationFilter & {
      dashboardShareId?: string;
      sheetName?: string;
      cellRange?: string;
      templateWorkbookBase64?: string;
      templateWorkbookFilename?: string;
    };

    let visualization: VisualizationTypes.VisualizationType;
    if (dashboardShareId && name && typeof type === 'string') {
      visualization = await Factory.getInstance()
        .getBZL()
        .VisualizationBZL
        .findSharedThroughDashboard(dashboardShareId, name, type, userId);
    } else if (shareId) {
      visualization = await Factory.getInstance()
        .getBZL()
        .VisualizationBZL
        .findShared(shareId, userId);
    } else {
      const visualizationFilter: VisualizationTypes.VisualizationFilter = {
        userId,
        name,
        type
      };
      ValidatorSchemas.validateWithSchema<
        VisualizationTypes.VisualizationFilter
      >(ValidatorSchemas.visualizationFilterSchema, visualizationFilter);
      visualization = await Factory.getInstance()
        .getBZL()
        .VisualizationBZL
        .findOne(visualizationFilter);
    }

    const workbook = await createVisualizationExcelWorkbook(visualization, {
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
      type,
      shareId,
      dashboardShareId,
      sheetName,
      cellRange,
      templateWorkbookBase64,
      templateWorkbookFilename,
      formats,
      charts,
      previewDataUrl,
      documentOptions,
      title
    } = getExportRequestBody(request) as VisualizationTypes.VisualizationFilter & {
      dashboardShareId?: string;
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

    const wantsExcel = Array.isArray(formats) && formats.includes('excel');
    const uploadedTemplateFiles = getUploadedTemplateFiles(request);
    let visualization: VisualizationTypes.VisualizationType | undefined;

    if (dashboardShareId && name && typeof type === 'string') {
      visualization = await Factory.getInstance()
        .getBZL()
        .VisualizationBZL
        .findSharedThroughDashboard(dashboardShareId, name, type, userId);
    } else if (shareId) {
      visualization = await Factory.getInstance()
        .getBZL()
        .VisualizationBZL
        .findShared(shareId, userId);
    } else if (name && typeof type === 'string') {
      const visualizationFilter: VisualizationTypes.VisualizationFilter = {
        userId,
        name,
        type
      };
      ValidatorSchemas.validateWithSchema<
        VisualizationTypes.VisualizationFilter
      >(ValidatorSchemas.visualizationFilterSchema, visualizationFilter);
      visualization = await Factory.getInstance()
        .getBZL()
        .VisualizationBZL
        .findOne(visualizationFilter);
    }

    if (!visualization && wantsExcel) {
      throw new Error('Open a saved visualization before exporting as Excel.');
    }

    const exportTitle = title || visualization?.name || name || 'Illustry visualization';
    const bundle = await createVisualizationExportBundle({
      title: exportTitle,
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
      visualization: visualization || ({
        _id: 'detached-export',
        userId,
        projectName: 'Detached export',
        name: exportTitle,
        type: typeof type === 'string' ? type : 'custom',
        data: {}
      } as VisualizationTypes.VisualizationType)
    });

    response.setHeader('Content-Type', bundle.mimeType);
    response.setHeader('Content-Disposition', `attachment; filename="${bundle.filename}"`);
    response.setHeader('X-Illustry-Bundled', bundle.bundled ? 'true' : 'false');
    response.send(bundle.buffer);
  } catch (err) {
    returnResponse(response, (err as Error), null, next);
  }
};

const previewOfficeVisualization = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const preview = createOfficeVisualizationPreview(request.body as OfficeRangePayload);
    returnResponse(response, null, preview, next);
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
  exportExcel,
  exportBundle,
  previewOfficeVisualization,
  respondToShareInvite,
  browse,
  _delete,
  createOrUpdateExternal
};
