
import { VisualizationTypes, ProjectTypes, FileTypes, UtilTypes, GenericTypes } from '@illustry/types'

import { generateErrorMessage } from 'zod-error';
import {
  excelFilesToVisualizations,
  jsonFilesToVisualizations,
  csvFilesToVisualizations,
  xmlFilesToVisualizations
} from '../../utils/reader';
import { visualizationTypeSchema } from '../../validators/allValidators';
import Factory from '../../factory';
import DbaccInstance from '../../dbacc/lib';
import prettifyZodError from '../../validators/prettifyError';

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

  create(data: VisualizationTypes.VisualizationCreate): Promise<VisualizationTypes.VisualizationType> {
    throw new Error('Method not implemented.');
  }
  update(filter: VisualizationTypes.VisualizationFilter, data: UtilTypes.DeepPartial<VisualizationTypes.VisualizationType>): Promise<VisualizationTypes.VisualizationType | null> {
    throw new Error('Method not implemented.');
  }

  async createOrUpdate(
    visualization: VisualizationTypes.VisualizationCreate
  ): Promise<VisualizationTypes.VisualizationType | null> {
    const { name, type, projectName } = visualization;

    if (typeof type === 'string') {
      const visualizationFilter = this.dbaccInstance.Visualization.createFilter({
        name,
        type,
        projectName
      });

      const returnedVisualization = await this.dbaccInstance.Visualization.update(
        visualizationFilter,
        visualization
      );
      return returnedVisualization;
    }
    await Promise.all(
      type.map(async (singleType) => {
        const visualizationFilter = this.dbaccInstance.Visualization.createFilter({
          name,
          type: singleType,
          projectName
        });

        const visualizationUpdate: VisualizationTypes.VisualizationUpdate = { ...visualization, type: singleType };

        await this.dbaccInstance.Visualization.update(
          visualizationFilter,
          visualizationUpdate
        );
      })
    );

    return visualization as VisualizationTypes.VisualizationType;
  }

  async createOrUpdateFromFiles(
    files: FileTypes.FileProperties[],
    includeAllFileDetails: boolean,
    visualizationUpdate: VisualizationTypes.VisualizationUpdate,
    fileDetails: FileTypes.FileDetails
  ): Promise<(VisualizationTypes.VisualizationType | null)[]> {
    const projectBZL = Factory.getInstance().getBZL().ProjectBZL;

    const { projects } = await projectBZL.browse({ isActive: true } as ProjectTypes.ProjectFilter);

    if (!projects || projects.length === 0) {
      throw new Error('No Active Project');
    }

    if (!fileDetails) {
      throw new Error('No file details were provided');
    }

    const projectName = projects[0].name;

    switch (fileDetails.fileType) {
      case 'EXCEL':
        return this.processExcelFiles(
          files,
          includeAllFileDetails,
          projectName,
          fileDetails,
          visualizationUpdate
        );
      case 'JSON':
        return this.processJsonFiles(
          files,
          includeAllFileDetails,
          projectName,
          visualizationUpdate
        );
      case 'CSV':
        return this.processCsvFiles(
          files,
          includeAllFileDetails,
          projectName,
          fileDetails,
          visualizationUpdate
        );
      case 'XML':
        return this.processXmlFiles(
          files,
          includeAllFileDetails,
          projectName,
          visualizationUpdate
        );
      default:
        throw new Error('Invalid file type provided');
    }
  }

  async findOne(filter: VisualizationTypes.VisualizationFilter): Promise<VisualizationTypes.VisualizationType> {
    const projectBZL = Factory.getInstance().getBZL().ProjectBZL;

    const { projects } = await projectBZL.browse({ isActive: true } as ProjectTypes.ProjectFilter);

    if (!projects || projects.length === 0) {
      throw new Error('No active project');
    }

    const activeProjectName = projects[0].name;
    const updatedFilter = {
      ...filter,
      projectName: activeProjectName
    };

    const queryFilter: UtilTypes.ExtendedMongoQuery = this.dbaccInstance.Visualization.createFilter(updatedFilter);
    return this.dbaccInstance.Visualization.findOne(queryFilter) as unknown as VisualizationTypes.VisualizationType;
  }

  async browse(filter: VisualizationTypes.VisualizationFilter): Promise<VisualizationTypes.ExtendedVisualizationType> {
    const projectBZL = Factory.getInstance().getBZL().ProjectBZL;

    const { projects } = await projectBZL.browse({ isActive: true } as ProjectTypes.ProjectFilter);

    if (!projects || projects.length === 0) {
      throw new Error('No active project');
    }

    const activeProjectName = projects[0].name;

    const updatedFilter: VisualizationTypes.VisualizationFilter = {
      ...filter,
      projectName: activeProjectName
    };

    const queryFilter: UtilTypes.ExtendedMongoQuery = this.dbaccInstance.Visualization.createFilter(updatedFilter);

    return this.dbaccInstance.Visualization.browse(queryFilter);
  }

  async delete(filter: VisualizationTypes.VisualizationFilter): Promise<boolean> {
    const queryFilter: UtilTypes.ExtendedMongoQuery = filter ? this.dbaccInstance.Visualization.createFilter(filter) : {};

    await this.dbaccInstance.Visualization.deleteMany(queryFilter);

    return true;
  }

  private async processVisualizationDetails(
    illustrations: unknown[],
    includeAllFileDetails: boolean,
    projectName: string,
    visualizationUpdate: VisualizationTypes.VisualizationUpdate
  ): Promise<(VisualizationTypes.VisualizationType | null)[]> {
    const processVisualization = async (illustration: unknown) => {
      const visualizationData: VisualizationTypes.VisualizationCreate = { ...(illustration as VisualizationTypes.VisualizationCreate), projectName };

      if (!includeAllFileDetails) {
        Object.entries(visualizationUpdate).forEach(([key, value]) => {
          (visualizationData as Record<string, unknown>)[key] = value;
        });
      }

      const validationResult = visualizationTypeSchema.safeParse(visualizationData);
      if (!validationResult.success) {
        const errorMessage = generateErrorMessage(validationResult.error.issues, prettifyZodError());
        throw new Error(errorMessage);
      }

      return this.createOrUpdate(visualizationData);
    };

    return Promise.all(illustrations.map(processVisualization));
  }

  private async processJsonFiles(
    files: FileTypes.FileProperties[],
    includeAllFileDetails: boolean,
    projectName: string,
    visualizationUpdate: VisualizationTypes.VisualizationUpdate
  ): Promise<(VisualizationTypes.VisualizationType | null)[]> {
    const visualizations = await jsonFilesToVisualizations(
      files,
      visualizationUpdate.type as VisualizationTypes.VisualizationTypesEnum,
      includeAllFileDetails
    );

    return this.processVisualizationDetails(
      visualizations,
      includeAllFileDetails,
      projectName,
      visualizationUpdate
    );
  }

  private async processXmlFiles(
    files: FileTypes.FileProperties[],
    includeAllFileDetails: boolean,
    projectName: string,
    visualizationUpdate: VisualizationTypes.VisualizationUpdate
  ): Promise<(VisualizationTypes.VisualizationType | null)[]> {

    const visualizations = await xmlFilesToVisualizations(
      files,
      visualizationUpdate.type as VisualizationTypes.VisualizationTypesEnum,
      includeAllFileDetails
    );

    return this.processVisualizationDetails(
      visualizations,
      includeAllFileDetails,
      projectName,
      visualizationUpdate
    );
  }

  private async processExcelFiles(
    files: FileTypes.FileProperties[],
    includeAllFileDetails: boolean,
    projectName: string,
    fileDetails: FileTypes.FileDetails,
    visualizationUpdate: VisualizationTypes.VisualizationUpdate
  ): Promise<(VisualizationTypes.VisualizationType | null)[]> {

    const visualizations = await excelFilesToVisualizations(
      files,
      fileDetails,
      visualizationUpdate.type as VisualizationTypes.VisualizationTypesEnum,
      includeAllFileDetails
    );

    return this.processVisualizationDetails(
      visualizations,
      includeAllFileDetails,
      projectName,
      visualizationUpdate
    );
  }

  private async processCsvFiles(
    files: FileTypes.FileProperties[],
    includeAllFileDetails: boolean,
    projectName: string,
    fileDetails: FileTypes.FileDetails,
    visualizationUpdate: VisualizationTypes.VisualizationUpdate
  ): Promise<(VisualizationTypes.VisualizationType | null)[]> {

    const visualizations = await csvFilesToVisualizations(
      files,
      fileDetails,
      visualizationUpdate.type as VisualizationTypes.VisualizationTypesEnum,
      includeAllFileDetails
    );

    return this.processVisualizationDetails(
      visualizations,
      includeAllFileDetails,
      projectName,
      visualizationUpdate
    );
  }
}

export default VisualizationBZL;