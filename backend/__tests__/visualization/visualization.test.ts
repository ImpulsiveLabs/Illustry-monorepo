import { ProjectTypes, FileTypes, VisualizationTypes, TransformerTypes } from "@illustry/types";
import mongoose from "mongoose";
import path from "path";
import { copyDirectory } from "../../src/utils/helper";
import Factory from "../../src/factory";
import { exelOrCsvdataProvider, jsonDataProvider, xmlDataProvider } from "../../src/bzl/transformers/preprocess/dataProvider";
import transformerProvider from "../../src/bzl/transformers/preprocess/transformersProvider";
import { computeValues as computeAxisChartValues } from "../../src/bzl/transformers/preprocess/transformers/axisChartTransformer";
import { computeValues as computeScatterValues } from "../../src/bzl/transformers/preprocess/transformers/scatterTransformer";
import { reformatDate } from "../../src/bzl/transformers/preprocess/transformers/calendarTransformers";
import { hierarchyExtractorCsvOrExcel } from "../../src/bzl/transformers/preprocess/transformers/hierarchyTransformers";
process.env.NODE_ENV = "test";
process.env.MONGO_TEST_URL = "mongodb://localhost:27017/illustrytest";
process.env.MONGO_USER = "root"
process.env.MONGO_PASSWORD = "rootPass"

const factory = Factory.getInstance();
const jsonDirectoryPath = path.resolve(
  __dirname,
  "../../__tests_resources__/json/"
);
const xmlDirectoryPath = path.resolve(
  __dirname,
  "../../__tests_resources__/xml/"
);
const excelDirectoryPath = path.resolve(
  __dirname,
  "../../__tests_resources__/excel/"
);
const csvDirectoryPath = path.resolve(
  __dirname,
  "../../__tests_resources__/csv/"
);
describe("visualizations CRUD", () => {
  beforeAll(async () => {
    const expectedProject: ProjectTypes.ProjectCreate = {
      name: "Test_Project1",
      description: "Test_ProjectDescription1",
      isActive: true,
    };
    let existingProject: ProjectTypes.ProjectType | null = null;
    try {
      existingProject = await factory.getBZL().ProjectBZL.findOne({ name: expectedProject.name });
    } catch (err) {
      existingProject = null;
    }
    if (existingProject) {
      await factory.getBZL().ProjectBZL.delete({ name: expectedProject.name });
    }
    await copyDirectory(jsonDirectoryPath, path.resolve(__dirname));
    await copyDirectory(xmlDirectoryPath, path.resolve(__dirname));
    await copyDirectory(excelDirectoryPath, path.resolve(__dirname));
    await copyDirectory(csvDirectoryPath, path.resolve(__dirname));
    await factory.getBZL().ProjectBZL.create(expectedProject);
  });

  afterAll(async () => {
    delete process.env.NODE_ENV;
    const allProjects = await factory.getBZL().ProjectBZL.browse({});

    const deletePromises = (allProjects.projects || []).map(async (project) => {
      await factory.getBZL().ProjectBZL.delete({ name: project.name });
    });

    await Promise.all(deletePromises);
    await mongoose.disconnect();
  });
  it("It creates a hierarchical-edge-bundling Visualization JSON with all the details in the JSON", async () => {
    const filePath = path.resolve(__dirname, "./HEB_FullDetails.json");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "application/json" }];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {};
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.JSON };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      projectName: "Test_Project1",
      name: "HEB_FullDetails",
      description: "HEB_FullDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.HIERARCHICAL_EDGE_BUNDLING],
      data: {
        nodes: [
          {
            category: "1",
            name: "Node1",
          },
          {
            category: "2",
            name: "Node2",
          },
          {
            category: "3",
            name: "Node3",
          },
        ],
        links: [
          {
            source: "Node1",
            target: "Node2",
            value: 1,
          },
          {
            source: "Node2",
            target: "Node3",
            value: 1,
          },
          {
            source: "Node3",
            target: "Node2",
            value: 1,
          },
        ],
      },
    };
    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a force-directed-graph Visualization JSON with all the details in the JSON", async () => {

    const filePath = path.resolve(__dirname, "./FLG_FullDetails.json");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "application/json" }];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {};
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.JSON };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      projectName: "Test_Project1",
      name: "FLG_FullDetails",
      description: "FLG_FullDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.FORCE_DIRECTED_GRAPH],
      data: {
        nodes: [
          {
            category: "1",
            name: "Node1",
          },
          {
            category: "2",
            name: "Node2",
          },
          {
            category: "3",
            name: "Node3",
          },
        ],
        links: [
          {
            source: "Node1",
            target: "Node2",
            value: 1,
          },
          {
            source: "Node2",
            target: "Node3",
            value: 1,
          },
          {
            source: "Node3",
            target: "Node2",
            value: 1,
          },
        ],
      },
    };
    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    const normalizedVisualization = JSON.parse(JSON.stringify(visualization));
    expect(normalizedVisualization).toMatchObject(expectedVisualization);
  });

  it("It creates a sankey Visualization JSON with all the details in the JSON", async () => {

    const filePath = path.resolve(__dirname, "./Sankey_FullDetails.json");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "application/json" }];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {};
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.JSON };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      projectName: "Test_Project1",
      name: "Sankey_FullDetails",
      description: "Sankey_FullDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.SANKEY],
      data: {
        nodes: [
          {
            category: "1",
            name: "Node1",
          },
          {
            category: "2",
            name: "Node2",
          },
          {
            category: "3",
            name: "Node3",
          },
        ],
        links: [
          {
            source: "Node1",
            target: "Node2",
            value: 1,
          },
          {
            source: "Node2",
            target: "Node3",
            value: 1,
          },
        ],
      },
    };
    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    const normalizedVisualization = JSON.parse(JSON.stringify(visualization));
    expect(normalizedVisualization).toMatchObject(expectedVisualization);
  });
  it("It creates a word-cloud Visualization JSON with all the details in the JSON", async () => {

    const filePath = path.resolve(__dirname, "./Wordcloud_FullDetails.json");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "application/json" }];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {};
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.JSON };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      projectName: "Test_Project1",
      name: "Wordcloud_FullDetails",
      description: "Wordcloud_FullDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.WORD_CLOUD],
      data: {
        words: [
          {
            name: "Word1",
            value: 390,
          },
          {
            name: "Word2",
            value: 275,
          },
          {
            name: "Word3",
            value: 100,
          },
          {
            name: "Word4",
            value: 1000,
          },
          {
            name: "Word5",
            value: 600,
          },
          {
            name: "Word6",
            value: 146,
          },
          {
            name: "Word7",
            value: 712,
          },
        ],
      },
    };
    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    const normalizedVisualization = JSON.parse(JSON.stringify(visualization));
    expect(normalizedVisualization).toMatchObject(expectedVisualization);
  });
  it("It creates a calendar Visualization JSON with all the details in the JSON", async () => {

    const filePath = path.resolve(__dirname, "./Calendar_FullDetails.json");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "application/json" }];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {};
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.JSON };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      projectName: "Test_Project1",
      name: "Calendar_FullDetails",
      description: "Calendar_FullDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.CALENDAR],
      data: {
        calendar: [
          {
            date: "1939-09-02",
            value: 1,
            category: "1",
          },
          {
            date: "1939-09-07",
            value: 1,
            category: "2",
          },
          {
            date: "1939-09-17",
            value: 1,
            category: "3",
          },
          {
            date: "1939-10-06",
            value: 1,
            category: "1",
          },
          {
            date: "1939-10-07",
            value: 1,
            category: "1",
          },
          {
            date: "1939-10-14",
            value: 1,
            category: "5",
          },
          {
            date: "1939-10-17",
            value: 1,
            category: "1",
          },
          {
            date: "1939-10-22",
            value: 1,
            category: "6",
          },
          {
            date: "1939-10-28",
            value: 1,
            category: "1",
          },
          {
            date: "1939-11-04",
            value: 1,
            category: "7",
          },
          {
            date: "1939-11-28",
            value: 1,
            category: "3",
          },
          {
            date: "1939-12-05",
            value: 1,
            category: "3",
          },
          {
            date: "1939-12-11",
            value: 1,
            category: "2",
          },
          {
            date: "1939-12-16",
            value: 1,
            category: "2",
          },
          {
            date: "1939-12-23",
            value: 1,
            category: "1",
          },
        ],
      },
    };
    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    const normalizedVisualization = JSON.parse(JSON.stringify(visualization));
    expect(normalizedVisualization).toMatchObject(expectedVisualization);
  });
  it("It creates a matrix Visualization JSON with all the details in the JSON", async () => {

    const filePath = path.resolve(__dirname, "./Matrix_FullDetails.json");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "application/json" }];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {};
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.JSON };
    const expectedVisualization = {
      projectName: "Test_Project1",
      name: "Matrix_FullDetails",
      description: "Matrix_FullDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.MATRIX],
      data: {
        nodes: [
          {
            category: "1",
            name: "Node1",
            labels: [
              {
                name: "Label1",
                value: 1,
                properties: {
                  style: {
                    "font-weight": "bold",
                    "background-color": "#541690",
                    "background-color1": "541690",
                  },
                },
              },
              {
                name: "Label2",
                value: 0,
                properties: [
                  {
                    style: {
                      "font-weight": "bold",
                      "background-color": "#541690",
                      "background-color1": "541690",
                    },
                  },
                ],
              },
            ],
          },
          {
            category: "2",
            name: "Node2",
            labels: [
              {
                name: "Label3",
                value: 1,
                properties: {
                  style: {
                    "font-weight": "bold",
                    "background-color": "#541690",
                    "background-color1": "541690",
                  },
                },
              },
              {
                name: "Label4",
                value: 0,
                properties: [
                  {
                    style: {
                      "font-weight": "bold",
                      "background-color": "#541690",
                      "background-color1": "541690",
                    },
                  },
                ],
              },
            ],
          },
        ],
        links: [
          {
            source: "Node1",
            target: "Node2",
            value: 1,
            properties: {
              style: {
                "font-weight": "bold",
                "background-color": "#541690",
                "background-color1": "541690",
              },
              a: "b",
            },
          },
          {
            source: "Node2",
            target: "Node1",
            value: 1,
            properties: {
              style: {
                "font-weight": "bold",
                "background-color": "#541690",
                "background-color1": "541690",
              },
              a: "b",
            },
          },
        ],
      },
    };
    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    const normalizedVisualization = JSON.parse(JSON.stringify(visualization));
    expect(normalizedVisualization).toMatchObject(expectedVisualization);
  });
  it("It creates a line-chart Visualization JSON with all the details in the JSON", async () => {

    const filePath = path.resolve(__dirname, "./LineChart_FullDetails.json");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "application/json" }];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {};
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.JSON };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      projectName: "Test_Project1",
      name: "LineChart_FullDetails",
      description: "LineChart_FullDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.LINE_CHART],
      data: {
        headers: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        values: {
          "Statistic 1": [120, 132, 101, 134, 90, 230, 210],
          "Statistic 2": [220, 182, 191, 234, 290, 330, 310],
          "Statistic 3": [150, 232, 201, 154, 190, 330, 410],
          "Statistic 4": [320, 332, 301, 334, 390, 330, 320],
        },
      },
    };
    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    const normalizedVisualization = JSON.parse(JSON.stringify(visualization));
    expect(normalizedVisualization).toMatchObject(expectedVisualization);
  });
  it("It creates a bar-chart Visualization JSON with all the details in the JSON", async () => {

    const filePath = path.resolve(__dirname, "./BarChart_FullDetails.json");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "application/json" }];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {};
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.JSON };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      projectName: "Test_Project1",
      name: "BarChart_FullDetails",
      description: "BarChart_FullDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.BAR_CHART],
      data: {
        headers: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        values: {
          "Statistic 1": [120, 132, 101, 134, 90, 230, 210],
          "Statistic 2": [220, 182, 191, 234, 290, 330, 310],
          "Statistic 3": [150, 232, 201, 154, 190, 330, 410],
          "Statistic 4": [320, 332, 301, 334, 390, 330, 320],
        },
      },
    };
    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a pie-chart Visualization JSON with all the details in the JSON", async () => {

    const filePath = path.resolve(__dirname, "./PieChart_FullDetails.json");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "application/json" }];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {};
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.JSON };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      projectName: "Test_Project1",
      name: "PieChart_FullDetails",
      description: "PieChart_FullDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.PIE_CHART],
      data: {
        values: {
          "Statistic 1": 122,
          "Statistic 2": 222,
          "Statistic 3": 510,
          "Statistic 4": 320,
        },
      },
    };
    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a scatter Visualization JSON with all the details in the JSON", async () => {

    const filePath = path.resolve(__dirname, "./Scatter_FullDetails.json");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "application/json" }];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {};
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.JSON };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      projectName: "Test_Project1",
      name: "Scatter_FullDetails",
      description: "Scatter_FullDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.SCATTER],
      data: {
        points: [
          { value: [3.275154, 2.957587], category: "3" },
          { value: [-3.344465, 2.603513], category: "2" },
          { value: [0.355083, -3.376585], category: "2" },
          { value: [1.852435, 3.547351], category: "1" },
          { value: [-2.078973, 2.552013], category: "1" },
        ],
      },
    };
    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a funnel Visualization JSON with all the details in the JSON", async () => {

    const filePath = path.resolve(__dirname, "./Funnel_FullDetails.json");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "application/json" }];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {};
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.JSON };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      projectName: "Test_Project1",
      name: "Funnel_FullDetails",
      description: "Funnel_FullDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.FUNNEL],
      data: {
        values: {
          "Statistic 1": 122,
          "Statistic 2": 222,
          "Statistic 3": 510,
          "Statistic 4": 320,
        },
      },
    };
    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a treemap Visualization JSON with all the details in the JSON", async () => {

    const filePath = path.resolve(__dirname, "./Treemap_FullDetails.json");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "application/json" }];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {};
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.JSON };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      projectName: "Test_Project1",
      name: "Treemap_FullDetails",
      description: "Treemap_FullDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.TREEMAP],
      data: {
        nodes: [
          {
            name: "Node Group 1",
            value: 100,
            category: "1",
            children: [
              {
                name: "Node 1",
                value: 40,
                category: "2",
                children: [
                  {
                    name: "Node 1.1",
                    value: 20,
                    category: "3",
                  },
                  {
                    name: "Node 1.2",
                    value: 10,
                    category: "4",
                  },
                ],
              },
              {
                name: "Node 1.1",
                value: 30,
                category: "2",
                children: [
                  {
                    name: "Node 1.1.1",
                    value: 15,
                    category: "5",
                  },
                ],
              },
            ],
          },
          {
            name: "Node group 2",
            value: 50,
            category: "6",
            children: [
              {
                name: "Node 2",
                value: 25,
                category: "7",
                children: [
                  {
                    name: "Node 2.2",
                    value: 12,
                    category: "8",
                  },
                ],
              },
            ],
          },
        ],
      },
    };
    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a sunburst Visualization JSON with all the details in the JSON", async () => {

    const filePath = path.resolve(__dirname, "./Sunburst_FullDetails.json");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "application/json" }];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {};
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.JSON };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      projectName: "Test_Project1",
      name: "Sunburst_FullDetails",
      description: "Sunburst_FullDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.SUNBURST],
      data: {
        nodes: [
          {
            name: "Node Group 1",
            value: 100,
            category: "1",
            children: [
              {
                name: "Node 1",
                value: 40,
                category: "2",
                children: [
                  {
                    name: "Node 1.1",
                    value: 20,
                    category: "3",
                  },
                  {
                    name: "Node 1.2",
                    value: 10,
                    category: "4",
                  },
                ],
              },
              {
                name: "Node 1.1",
                value: 30,
                category: "2",
                children: [
                  {
                    name: "Node 1.1.1",
                    value: 15,
                    category: "5",
                  },
                ],
              },
            ],
          },
          {
            name: "Node group 2",
            value: 50,
            category: "6",
            children: [
              {
                name: "Node 2",
                value: 25,
                category: "7",
                children: [
                  {
                    name: "Node 2.2",
                    value: 12,
                    category: "8",
                  },
                ],
              },
            ],
          },
        ],
      },
    };
    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a timeline Visualization JSON with all the details in the JSON", async () => {

    const filePath = path.resolve(__dirname, "./Timeline_FullDetails.json");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "application/json" }];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {};
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.JSON };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      projectName: "Test_Project1",
      name: "Timeline_FullDetails",
      description: "Timeline_FullDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.TIMELINE],
      data: {
        "2023-10-07": {
          summary: {
            title: "Sample Timeline",
          },
          events: [
            {
              summary: "Event 1",
              date: "08:00:00",
              type: "Type A",
              author: "Author 1",
              tags: [{ name: "Tag A" }],
              description: "Description of Event 1",
            },
            {
              summary: "Event 2",
              date: "09:00:00",
              type: "Type B",
              author: "Author 2",
            },
          ],
        },
        "2023-10-10": {
          summary: {
            title: "Sample Timeline",
          },
          events: [
            {
              summary: "Event 3",
              date: "09:00:00",
              type: "Type C",
              author: "Author 3",
            },
            {
              summary: "Event 4",
              date: "10:00:00",
              type: "Type D",
              author: "Author 4",
            },
            {
              summary: "Event 5",
              date: "10:00:00",
              type: "Type E",
              author: "Author 5",
            },
          ],
        },
        "2023-10-08": {
          summary: {
            title: "Sample Timeline",
          },
          events: [
            {
              summary: "Event 6",
              date: "11:00:00",
              type: "Type F",
              author: "Author 6",
            },
            {
              summary: "Event 7",
              date: "11:00:00",
              type: "Type G",
              author: "Author 7",
            },
            {
              summary: "Event 8",
              date: "12:00:00",
              type: "Type H",
              author: "Author 8",
            },
          ],
        },
        "2023-10-06 ": {
          summary: {
            title: "Sample Timeline",
          },
          events: [
            {
              summary: "Event 9",
              date: "12:00:00",
              type: "Type I",
              author: "Author 9",
            },
            {
              summary: "Event 10",
              date: "13:00:00",
              type: "Type J",
              author: "Author 10",
            },
          ],
        },
      },
    };
    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization).toMatchObject(expectedVisualization);
  });

  it("It creates a hierarchical-edge-bundling Visualization JSON with only the data details in the JSON", async () => {

    const filePath = path.resolve(__dirname, "./HEB_PartialDetails.json");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "application/json" }];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "HEB_PartialDetails",
      description: "HEB_PartialDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.HIERARCHICAL_EDGE_BUNDLING],
    };
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.JSON };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      projectName: "Test_Project1",
      name: "HEB_PartialDetails",
      description: "HEB_PartialDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.HIERARCHICAL_EDGE_BUNDLING],
      data: {
        nodes: [
          {
            category: "1",
            name: "Node1",
          },
          {
            category: "2",
            name: "Node2",
          },
          {
            category: "3",
            name: "Node3",
          },
        ],
        links: [
          {
            source: "Node1",
            target: "Node2",
            value: 1,
          },
          {
            source: "Node2",
            target: "Node3",
            value: 1,
          },
          {
            source: "Node3",
            target: "Node2",
            value: 1,
          },
        ],
      },
    };
    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a force-directed-graph Visualization JSON with only the data details in the JSON", async () => {

    const filePath = path.resolve(__dirname, "./FLG_PartialDetails.json");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "application/json" }];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "FLG_PartialDetails",
      description: "FLG_PartialDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.FORCE_DIRECTED_GRAPH],
    };
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.JSON };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      projectName: "Test_Project1",
      name: "FLG_PartialDetails",
      description: "FLG_PartialDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.FORCE_DIRECTED_GRAPH],
      data: {
        nodes: [
          {
            category: "1",
            name: "Node1",
          },
          {
            category: "2",
            name: "Node2",
          },
          {
            category: "3",
            name: "Node3",
          },
        ],
        links: [
          {
            source: "Node1",
            target: "Node2",
            value: 1,
          },
          {
            source: "Node2",
            target: "Node3",
            value: 1,
          },
          {
            source: "Node3",
            target: "Node2",
            value: 1,
          },
        ],
      },
    };
    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a sankey Visualization JSON with only the data details in the JSON", async () => {

    const filePath = path.resolve(__dirname, "./Sankey_PartialDetails.json");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "application/json" }];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "Sankey_PartialDetails",
      description: "Sankey_PartialDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.SANKEY],
    };
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.JSON };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      projectName: "Test_Project1",
      name: "Sankey_PartialDetails",
      description: "Sankey_PartialDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.SANKEY],
      data: {
        nodes: [
          {
            category: "1",
            name: "Node1",
          },
          {
            category: "2",
            name: "Node2",
          },
          {
            category: "3",
            name: "Node3",
          },
        ],
        links: [
          {
            source: "Node1",
            target: "Node2",
            value: 1,
          },
          {
            source: "Node2",
            target: "Node3",
            value: 1,
          },
        ],
      },
    };
    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a word-cloud Visualization JSON with only the data details in the JSON", async () => {

    const filePath = path.resolve(__dirname, "./Wordcloud_PartialDetails.json");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "application/json" }];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "Wordcloud_PartialDetails",
      description: "Wordcloud_PartialDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.WORD_CLOUD],
    };
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.JSON };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      projectName: "Test_Project1",
      name: "Wordcloud_PartialDetails",
      description: "Wordcloud_PartialDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.WORD_CLOUD],
      data: {
        words: [
          {
            name: "Word1",
            value: 390,
          },
          {
            name: "Word2",
            value: 275,
          },
          {
            name: "Word3",
            value: 100,
          },
          {
            name: "Word4",
            value: 1000,
          },
          {
            name: "Word5",
            value: 600,
          },
          {
            name: "Word6",
            value: 146,
          },
          {
            name: "Word7",
            value: 712,
          },
        ],
      },
    };
    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a calendar Visualization JSON with only the data details in the JSON", async () => {

    const filePath = path.resolve(__dirname, "./Calendar_PartialDetails.json");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "application/json" }];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "Calendar_PartialDetails",
      description: "Calendar_PartialDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.CALENDAR],
    };
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.JSON };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      projectName: "Test_Project1",
      name: "Calendar_PartialDetails",
      description: "Calendar_PartialDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.CALENDAR],
      data: {
        calendar: [
          {
            date: "1939-09-02",
            value: 1,
            category: "1",
          },
          {
            date: "1939-09-07",
            value: 1,
            category: "2",
          },
          {
            date: "1939-09-17",
            value: 1,
            category: "3",
          },
          {
            date: "1939-10-06",
            value: 1,
            category: "1",
          },
          {
            date: "1939-10-07",
            value: 1,
            category: "1",
          },
          {
            date: "1939-10-14",
            value: 1,
            category: "5",
          },
          {
            date: "1939-10-17",
            value: 1,
            category: "1",
          },
          {
            date: "1939-10-22",
            value: 1,
            category: "6",
          },
          {
            date: "1939-10-28",
            value: 1,
            category: "1",
          },
          {
            date: "1939-11-04",
            value: 1,
            category: "7",
          },
          {
            date: "1939-11-28",
            value: 1,
            category: "3",
          },
          {
            date: "1939-12-05",
            value: 1,
            category: "3",
          },
          {
            date: "1939-12-11",
            value: 1,
            category: "2",
          },
          {
            date: "1939-12-16",
            value: 1,
            category: "2",
          },
          {
            date: "1939-12-23",
            value: 1,
            category: "1",
          },
        ],
      },
    };
    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a matrix Visualization JSON with only the data details in the JSON", async () => {

    const filePath = path.resolve(__dirname, "./Matrix_PartialDetails.json");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "application/json" }];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "Matrix_PartialDetails",
      description: "Matrix_PartialDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.MATRIX],
    };
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.JSON };
    const expectedVisualization = {
      projectName: "Test_Project1",
      name: "Matrix_PartialDetails",
      description: "Matrix_PartialDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.MATRIX],
      data: {
        nodes: [
          {
            category: "1",
            name: "Node1",
            labels: [
              {
                name: "Label1",
                value: 1,
                properties: {
                  style: {
                    "font-weight": "bold",
                    "background-color": "#541690",
                    "background-color1": "541690",
                  },
                },
              },
              {
                name: "Label2",
                value: 0,
                properties: [
                  {
                    style: {
                      "font-weight": "bold",
                      "background-color": "#541690",
                      "background-color1": "541690",
                    },
                  },
                ],
              },
            ],
          },
          {
            category: "2",
            name: "Node2",
            labels: [
              {
                name: "Label3",
                value: 1,
                properties: {
                  style: {
                    "font-weight": "bold",
                    "background-color": "#541690",
                    "background-color1": "541690",
                  },
                },
              },
              {
                name: "Label4",
                value: 0,
                properties: [
                  {
                    style: {
                      "font-weight": "bold",
                      "background-color": "#541690",
                      "background-color1": "541690",
                    },
                  },
                ],
              },
            ],
          },
        ],
        links: [
          {
            source: "Node1",
            target: "Node2",
            value: 1,
            properties: {
              style: {
                "font-weight": "bold",
                "background-color": "#541690",
                "background-color1": "541690",
              },
              a: "b",
            },
          },
          {
            source: "Node2",
            target: "Node1",
            value: 1,
            properties: {
              style: {
                "font-weight": "bold",
                "background-color": "#541690",
                "background-color1": "541690",
              },
              a: "b",
            },
          },
        ],
      },
    };
    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a line-chart Visualization JSON with only the data details in the JSON", async () => {

    const filePath = path.resolve(__dirname, "./LineChart_PartialDetails.json");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "application/json" }];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "LineChart_PartialDetails",
      description: "LineChart_PartialDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.LINE_CHART],
    };
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.JSON };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      projectName: "Test_Project1",
      name: "LineChart_PartialDetails",
      description: "LineChart_PartialDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.LINE_CHART],
      data: {
        headers: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        values: {
          "Statistic 1": [120, 132, 101, 134, 90, 230, 210],
          "Statistic 2": [220, 182, 191, 234, 290, 330, 310],
          "Statistic 3": [150, 232, 201, 154, 190, 330, 410],
          "Statistic 4": [320, 332, 301, 334, 390, 330, 320],
        },
      },
    };
    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a bar-chart Visualization JSON with only the data details in the JSON", async () => {

    const filePath = path.resolve(__dirname, "./BarChart_PartialDetails.json");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "application/json" }];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "BarChart_PartialDetails",
      description: "BarChart_PartialDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.BAR_CHART],
    };
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.JSON };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      projectName: "Test_Project1",
      name: "BarChart_PartialDetails",
      description: "BarChart_PartialDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.BAR_CHART],
      data: {
        headers: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        values: {
          "Statistic 1": [120, 132, 101, 134, 90, 230, 210],
          "Statistic 2": [220, 182, 191, 234, 290, 330, 310],
          "Statistic 3": [150, 232, 201, 154, 190, 330, 410],
          "Statistic 4": [320, 332, 301, 334, 390, 330, 320],
        },
      },
    };
    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a pie-chart Visualization JSON with only the data details in the JSON", async () => {

    const filePath = path.resolve(__dirname, "./PieChart_PartialDetails.json");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "application/json" }];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "PieChart_PartialDetails",
      description: "PieChart_PartialDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.PIE_CHART],
    };
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.JSON };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      projectName: "Test_Project1",
      name: "PieChart_PartialDetails",
      description: "PieChart_PartialDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.PIE_CHART],
      data: {
        values: {
          "Statistic 1": 122,
          "Statistic 2": 222,
          "Statistic 3": 510,
          "Statistic 4": 320,
        },
      },
    };
    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a scatter Visualization JSON with only the data details in the JSON", async () => {

    const filePath = path.resolve(__dirname, "./Scatter_PartialDetails.json");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "application/json" }];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "Scatter_PartialDetails",
      description: "Scatter_PartialDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.SCATTER],
    };
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.JSON };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      projectName: "Test_Project1",
      name: "Scatter_PartialDetails",
      description: "Scatter_PartialDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.SCATTER],
      data: {
        points: [
          { value: [3.275154, 2.957587], category: "3" },
          { value: [-3.344465, 2.603513], category: "2" },
          { value: [0.355083, -3.376585], category: "2" },
          { value: [1.852435, 3.547351], category: "1" },
          { value: [-2.078973, 2.552013], category: "1" },
        ],
      },
    };
    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a funnel Visualization JSON with only the data details in the JSON", async () => {

    const filePath = path.resolve(__dirname, "./Funnel_PartialDetails.json");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "application/json" }];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "Funnel_PartialDetails",
      description: "Funnel_PartialDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.FUNNEL],
    };
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.JSON };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      projectName: "Test_Project1",
      name: "Funnel_PartialDetails",
      description: "Funnel_PartialDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.FUNNEL],
      data: {
        values: {
          "Statistic 1": 122,
          "Statistic 2": 222,
          "Statistic 3": 510,
          "Statistic 4": 320,
        },
      },
    };
    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a treemap Visualization JSON with only the data details in the JSON", async () => {

    const filePath = path.resolve(__dirname, "./Treemap_PartialDetails.json");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "application/json" }];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "Treemap_PartialDetails",
      description: "Treemap_PartialDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.TREEMAP],
    };
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.JSON };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      projectName: "Test_Project1",
      name: "Treemap_PartialDetails",
      description: "Treemap_PartialDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.TREEMAP],
      data: {
        nodes: [
          {
            name: "Node Group 1",
            value: 100,
            category: "1",
            children: [
              {
                name: "Node 1",
                value: 40,
                category: "2",
                children: [
                  {
                    name: "Node 1.1",
                    value: 20,
                    category: "3",
                  },
                  {
                    name: "Node 1.2",
                    value: 10,
                    category: "4",
                  },
                ],
              },
              {
                name: "Node 1.1",
                value: 30,
                category: "2",
                children: [
                  {
                    name: "Node 1.1.1",
                    value: 15,
                    category: "5",
                  },
                ],
              },
            ],
          },
          {
            name: "Node group 2",
            value: 50,
            category: "6",
            children: [
              {
                name: "Node 2",
                value: 25,
                category: "7",
                children: [
                  {
                    name: "Node 2.2",
                    value: 12,
                    category: "8",
                  },
                ],
              },
            ],
          },
        ],
      },
    };
    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a sunburst Visualization JSON with only the data details in the JSON", async () => {

    const filePath = path.resolve(__dirname, "./Sunburst_PartialDetails.json");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "application/json" }];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "Sunburst_PartialDetails",
      description: "Sunburst_PartialDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.SUNBURST],
    };
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.JSON };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      projectName: "Test_Project1",
      name: "Sunburst_PartialDetails",
      description: "Sunburst_PartialDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.SUNBURST],
      data: {
        nodes: [
          {
            name: "Node Group 1",
            value: 100,
            category: "1",
            children: [
              {
                name: "Node 1",
                value: 40,
                category: "2",
                children: [
                  {
                    name: "Node 1.1",
                    value: 20,
                    category: "3",
                  },
                  {
                    name: "Node 1.2",
                    value: 10,
                    category: "4",
                  },
                ],
              },
              {
                name: "Node 1.1",
                value: 30,
                category: "2",
                children: [
                  {
                    name: "Node 1.1.1",
                    value: 15,
                    category: "5",
                  },
                ],
              },
            ],
          },
          {
            name: "Node group 2",
            value: 50,
            category: "6",
            children: [
              {
                name: "Node 2",
                value: 25,
                category: "7",
                children: [
                  {
                    name: "Node 2.2",
                    value: 12,
                    category: "8",
                  },
                ],
              },
            ],
          },
        ],
      },
    };
    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a timeline Visualization JSON with only the data details in the JSON", async () => {

    const filePath = path.resolve(__dirname, "./Timeline_PartialDetails.json");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "application/json" }];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "Timeline_PartialDetails",
      description: "Timeline_PartialDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.TIMELINE],
    };
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.JSON };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      projectName: "Test_Project1",
      name: "Timeline_PartialDetails",
      description: "Timeline_PartialDetails description",
      tags: ["full"],
      type: [VisualizationTypes.VisualizationTypesEnum.TIMELINE],
      data: {
        "2023-10-07": {
          summary: {
            title: "Sample Timeline",
          },
          events: [
            {
              summary: "Event 1",
              date: "08:00:00",
              type: "Type A",
              author: "Author 1",
              tags: [{ name: "Tag A" }],
              description: "Description of Event 1",
            },
            {
              summary: "Event 2",
              date: "09:00:00",
              type: "Type B",
              author: "Author 2",
            },
          ],
        },
        "2023-10-10": {
          summary: {
            title: "Sample Timeline",
          },
          events: [
            {
              summary: "Event 3",
              date: "09:00:00",
              type: "Type C",
              author: "Author 3",
            },
            {
              summary: "Event 4",
              date: "10:00:00",
              type: "Type D",
              author: "Author 4",
            },
            {
              summary: "Event 5",
              date: "10:00:00",
              type: "Type E",
              author: "Author 5",
            },
          ],
        },
        "2023-10-08": {
          summary: {
            title: "Sample Timeline",
          },
          events: [
            {
              summary: "Event 6",
              date: "11:00:00",
              type: "Type F",
              author: "Author 6",
            },
            {
              summary: "Event 7",
              date: "11:00:00",
              type: "Type G",
              author: "Author 7",
            },
            {
              summary: "Event 8",
              date: "12:00:00",
              type: "Type H",
              author: "Author 8",
            },
          ],
        },
        "2023-10-06 ": {
          summary: {
            title: "Sample Timeline",
          },
          events: [
            {
              summary: "Event 9",
              date: "12:00:00",
              type: "Type I",
              author: "Author 9",
            },
            {
              summary: "Event 10",
              date: "13:00:00",
              type: "Type J",
              author: "Author 10",
            },
          ],
        },
      },
    };
    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a bar-chart Visualization XML with all the details in the XML", async () => {

    const filePath = path.resolve(__dirname, "./BarChart_FullDetails.xml");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "text/xml" }];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {};
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.XML };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      data: {
        headers: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        values: {
          Statistic_1: [120, 132, 101, 134, 90, 230, 210],
          Statistic_2: [220, 182, 191, 234, 290, 330, 310],
          Statistic_3: [150, 232, 201, 154, 190, 330, 410],
          Statistic_4: [320, 332, 301, 334, 390, 330, 320],
        },
      },
      name: "BarChart_FullDetails",
      description: "BarChart_FullDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.BAR_CHART,
      projectName: "Test_Project1",
    };

    const visualization = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization?.data).toMatchObject(expectedVisualization?.data as any);
    expect(visualization?.name).toBe(expectedVisualization.name);
    expect(visualization?.description).toBe(expectedVisualization.description);
    expect(visualization?.tags).toEqual(expectedVisualization.tags);
    expect(visualization?.type).toEqual(expectedVisualization.type);
    expect(visualization?.projectName).toBe(expectedVisualization.projectName);

  });
  it("It creates a calendar Visualization XML with all the details in the XML", async () => {

    const filePath = path.resolve(__dirname, "./Calendar_FullDetails.xml");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "text/xml" }];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {};
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.XML };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      data: {
        calendar: [
          {
            date: "1939-09-02",
            value: 1,
            category: "1",
          },
          {
            date: "1939-09-07",
            value: 1,
            category: "2",
          },
          {
            date: "1939-09-17",
            value: 1,
            category: "3",
          },
          {
            date: "1939-10-06",
            value: 1,
            category: "1",
          },
          {
            date: "1939-10-07",
            value: 1,
            category: "1",
          },
          {
            date: "1939-10-14",
            value: 1,
            category: "5",
          },
          {
            date: "1939-10-17",
            value: 1,
            category: "1",
          },
          {
            date: "1939-10-22",
            value: 1,
            category: "6",
          },
          {
            date: "1939-10-28",
            value: 1,
            category: "1",
          },
          {
            date: "1939-11-04",
            value: 1,
            category: "7",
          },
          {
            date: "1939-11-28",
            value: 1,
            category: "3",
          },
          {
            date: "1939-12-05",
            value: 1,
            category: "3",
          },
          {
            date: "1939-12-11",
            value: 1,
            category: "2",
          },
          {
            date: "1939-12-16",
            value: 1,
            category: "2",
          },
          {
            date: "1939-12-23",
            value: 1,
            category: "1",
          },
        ],
      },
      name: "Calendar_FullDetails",
      description: "Calendar_FullDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.CALENDAR,
      projectName: "Test_Project1",
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization?.data).toMatchObject(expectedVisualization?.data as any);
    expect(visualization?.name).toBe(expectedVisualization.name);
    expect(visualization?.description).toBe(expectedVisualization.description);
    expect(visualization?.tags).toEqual(expectedVisualization.tags);
    expect(visualization?.type).toEqual(expectedVisualization.type);
    expect(visualization?.projectName).toBe(expectedVisualization.projectName);
  });
  it("It creates a forced-directed-graph Visualization XML with all the details in the XML", async () => {

    const filePath = path.resolve(__dirname, "./FLG_FullDetails.xml");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "text/xml" }];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {};
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.XML };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      data: {
        nodes: [
          {
            category: "1",
            name: "Node1",
          },
          {
            category: "2",
            name: "Node2",
          },
          {
            category: "3",
            name: "Node3",
          },
        ],
        links: [
          {
            source: "Node1",
            target: "Node2",
            value: 1,
          },
          {
            source: "Node2",
            target: "Node3",
            value: 1,
          },
          {
            source: "Node3",
            target: "Node2",
            value: 1,
          },
        ],
      },
      name: "FLG_FullDetails",
      description: "FLG_FullDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.FORCE_DIRECTED_GRAPH,
      projectName: "Test_Project1",
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization?.data).toMatchObject(expectedVisualization?.data as any);
    expect(visualization?.name).toBe(expectedVisualization.name);
    expect(visualization?.description).toBe(expectedVisualization.description);
    expect(visualization?.tags).toEqual(expectedVisualization.tags);
    expect(visualization?.type).toEqual(expectedVisualization.type);
    expect(visualization?.projectName).toBe(expectedVisualization.projectName);
  });
  it("It creates a funnel Visualization XML with all the details in the XML", async () => {

    const filePath = path.resolve(__dirname, "./Funnel_FullDetails.xml");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "text/xml" }];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {};
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.XML };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      data: {
        values: {
          Statistic_1: 122,
          Statistic_2: 222,
          Statistic_3: 510,
          Statistic_4: 320,
        },
      },
      name: "Funnel_FullDetails",
      description: "Funnel_FullDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.FUNNEL,
      projectName: "Test_Project1",
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization?.data).toMatchObject(expectedVisualization?.data as any);
    expect(visualization?.name).toBe(expectedVisualization.name);
    expect(visualization?.description).toBe(expectedVisualization.description);
    expect(visualization?.tags).toEqual(expectedVisualization.tags);
    expect(visualization?.type).toEqual(expectedVisualization.type);
    expect(visualization?.projectName).toBe(expectedVisualization.projectName);
  });
  it("It creates a hierarchical-edge-bundling Visualization XML with all the details in the XML", async () => {

    const filePath = path.resolve(__dirname, "./HEB_FullDetails.xml");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "text/xml" }];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {};
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.XML };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      data: {
        nodes: [
          {
            name: "Node1",
            category: "1",
          },
          {
            name: "Node2",
            category: "2",
          },
          {
            name: "Node3",
            category: "3",
          },
        ],
        links: [
          {
            source: "Node1",
            target: "Node2",
            value: 1,
          },
          {
            source: "Node2",
            target: "Node3",
            value: 1,
          },
          {
            source: "Node3",
            target: "Node2",
            value: 1,
          },
        ],
      },
      name: "HEB_FullDetails",
      description: "HEB_FullDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.HIERARCHICAL_EDGE_BUNDLING,
      projectName: "Test_Project1",
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization?.data).toMatchObject(expectedVisualization?.data as any);
    expect(visualization?.name).toBe(expectedVisualization.name);
    expect(visualization?.description).toBe(expectedVisualization.description);
    expect(visualization?.tags).toEqual(expectedVisualization.tags);
    expect(visualization?.type).toEqual(expectedVisualization.type);
    expect(visualization?.projectName).toBe(expectedVisualization.projectName);
  });
  it("It creates a line-chart Visualization XML with all the details in the XML", async () => {

    const filePath = path.resolve(__dirname, "./LineChart_FullDetails.xml");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "text/xml" }];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {};
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.XML };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      data: {
        headers: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        values: {
          Statistic_1: [120, 132, 101, 134, 90, 230, 210],
          Statistic_2: [220, 182, 191, 234, 290, 330, 310],
          Statistic_3: [150, 232, 201, 154, 190, 330, 410],
          Statistic_4: [320, 332, 301, 334, 390, 330, 320],
        },
      },
      name: "LineChart_FullDetails",
      description: "LineChart_FullDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.LINE_CHART,
      projectName: "Test_Project1",
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization?.data).toMatchObject(expectedVisualization?.data as any);
    expect(visualization?.name).toBe(expectedVisualization.name);
    expect(visualization?.description).toBe(expectedVisualization.description);
    expect(visualization?.tags).toEqual(expectedVisualization.tags);
    expect(visualization?.type).toEqual(expectedVisualization.type);
    expect(visualization?.projectName).toBe(expectedVisualization.projectName);
  });
  it("It creates a pie-chart Visualization XML with all the details in the XML", async () => {

    const filePath = path.resolve(__dirname, "./PieChart_FullDetails.xml");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "text/xml" }];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {};
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.XML };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      data: {
        values: {
          Statistic_1: 122,
          Statistic_2: 222,
          Statistic_3: 510,
          Statistic_4: 320,
        },
      },
      name: "PieChart_FullDetails",
      description: "PieChart_FullDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.PIE_CHART,
      projectName: "Test_Project1",
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization?.data).toMatchObject(expectedVisualization?.data as any);
    expect(visualization?.name).toBe(expectedVisualization.name);
    expect(visualization?.description).toBe(expectedVisualization.description);
    expect(visualization?.tags).toEqual(expectedVisualization.tags);
    expect(visualization?.type).toEqual(expectedVisualization.type);
    expect(visualization?.projectName).toBe(expectedVisualization.projectName);
  });
  it("It creates a sankey Visualization XML with all the details in the XML", async () => {

    const filePath = path.resolve(__dirname, "./Sankey_FullDetails.xml");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "text/xml" }];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {};
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.XML };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      data: {
        nodes: [
          {
            name: "Node1",
            category: "1",
          },
          {
            name: "Node2",
            category: "2",
          },
          {
            name: "Node3",
            category: "3",
          },
        ],
        links: [
          {
            source: "Node1",
            target: "Node2",
            value: 1,
          },
          {
            source: "Node2",
            target: "Node3",
            value: 1,
          },
        ],
      },
      name: "Sankey_FullDetails",
      description: "Sankey_FullDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.SANKEY,
      projectName: "Test_Project1",
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization?.data).toMatchObject(expectedVisualization?.data as any);
    expect(visualization?.name).toBe(expectedVisualization.name);
    expect(visualization?.description).toBe(expectedVisualization.description);
    expect(visualization?.tags).toEqual(expectedVisualization.tags);
    expect(visualization?.type).toEqual(expectedVisualization.type);
    expect(visualization?.projectName).toBe(expectedVisualization.projectName);
  });
  it("It creates a scatter Visualization XML with all the details in the XML", async () => {

    const filePath = path.resolve(__dirname, "./Scatter_FullDetails.xml");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "text/xml" }];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {};
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.XML };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      data: {
        points: [
          {
            category: "3",
            value: [3.275154, 2.957587],
          },
          {
            category: "2",
            value: [-3.344465, 2.603513],
          },
          {
            category: "2",
            value: [0.355083, -3.376585],
          },
          {
            category: "1",
            value: [1.852435, 3.547351],
          },
          {
            category: "1",
            value: [-2.078973, 2.552013],
          },
        ],
      },
      name: "Scatter_FullDetails",
      description: "Scatter_FullDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.SCATTER,
      projectName: "Test_Project1",
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization?.data).toMatchObject(expectedVisualization?.data as any);
    expect(visualization?.name).toBe(expectedVisualization.name);
    expect(visualization?.description).toBe(expectedVisualization.description);
    expect(visualization?.tags).toEqual(expectedVisualization.tags);
    expect(visualization?.type).toEqual(expectedVisualization.type);
    expect(visualization?.projectName).toBe(expectedVisualization.projectName);
  });
  it("It creates a sunburst Visualization XML with all the details in the XML", async () => {

    const filePath = path.resolve(__dirname, "./Sunburst_FullDetails.xml");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "text/xml" }];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {};
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.XML };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      data: {
        nodes: [
          {
            name: "Node Group 1",
            category: "1",
            value: 100,
            children: [
              {
                name: "Node 1",
                category: "2",
                value: 40,
                children: [
                  {
                    name: "Node 1.1",
                    category: "3",
                    value: 20,
                  },
                  {
                    name: "Node 1.2",
                    category: "4",
                    value: 10,
                  },
                ],
              },
              {
                name: "Node 1.1",
                category: "2",
                value: 30,
                children: [
                  {
                    name: "Node 1.1.1",
                    category: "5",
                    value: 15,
                  },
                ],
              },
            ],
          },
          {
            name: "Node group 2",
            category: "6",
            value: 50,
            children: [
              {
                name: "Node 2",
                category: "7",
                value: 25,
                children: [
                  {
                    name: "Node 2.2",
                    category: "8",
                    value: 12,
                  },
                ],
              },
            ],
          },
        ],
      },
      name: "Sunburst_FullDetails",
      description: "Sunburst_FullDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.SUNBURST,
      projectName: "Test_Project1",
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization?.data).toMatchObject(expectedVisualization?.data as any);
    expect(visualization?.name).toBe(expectedVisualization.name);
    expect(visualization?.description).toBe(expectedVisualization.description);
    expect(visualization?.tags).toEqual(expectedVisualization.tags);
    expect(visualization?.type).toEqual(expectedVisualization.type);
    expect(visualization?.projectName).toBe(expectedVisualization.projectName);
  });
  it("It creates a treemap Visualization XML with all the details in the XML", async () => {

    const filePath = path.resolve(__dirname, "./Treemap_FullDetails.xml");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "text/xml" }];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {};
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.XML };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      data: {
        nodes: [
          {
            name: "Node Group 1",
            category: "1",
            value: 100,
            children: [
              {
                name: "Node 1",
                category: "2",
                value: 40,
                children: [
                  {
                    name: "Node 1.1",
                    category: "3",
                    value: 20,
                  },
                  {
                    name: "Node 1.2",
                    category: "4",
                    value: 10,
                  },
                ],
              },
              {
                name: "Node 1.1",
                category: "2",
                value: 30,
                children: [
                  {
                    name: "Node 1.1.1",
                    category: "5",
                    value: 15,
                  },
                ],
              },
            ],
          },
          {
            name: "Node group 2",
            category: "6",
            value: 50,
            children: [
              {
                name: "Node 2",
                category: "7",
                value: 25,
                children: [
                  {
                    name: "Node 2.2",
                    category: "8",
                    value: 12,
                  },
                ],
              },
            ],
          },
        ],
      },
      name: "Treemap_FullDetails",
      description: "Treemap_FullDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.TREEMAP,
      projectName: "Test_Project1",
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization?.data).toMatchObject(expectedVisualization?.data as any);
    expect(visualization?.name).toBe(expectedVisualization.name);
    expect(visualization?.description).toBe(expectedVisualization.description);
    expect(visualization?.tags).toEqual(expectedVisualization.tags);
    expect(visualization?.type).toEqual(expectedVisualization.type);
    expect(visualization?.projectName).toBe(expectedVisualization.projectName);
  });
  it("It creates a word-cloud Visualization XML with all the details in the XML", async () => {

    const filePath = path.resolve(__dirname, "./Wordcloud_FullDetails.xml");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "text/xml" }];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {};
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.XML };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      data: {
        words: [
          {
            name: "Word1",
            value: 390,
          },
          {
            name: "Word2",
            value: 275,
          },
          {
            name: "Word3",
            value: 100,
          },
          {
            name: "Word4",
            value: 1000,
          },
          {
            name: "Word5",
            value: 600,
          },
          {
            name: "Word6",
            value: 146,
          },
          {
            name: "Word7",
            value: 712,
          },
        ],
      },
      name: "Wordcloud_FullDetails",
      description: "Wordcloud_FullDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.WORD_CLOUD,
      projectName: "Test_Project1",
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization?.data).toMatchObject(expectedVisualization?.data as any);
    expect(visualization?.name).toBe(expectedVisualization.name);
    expect(visualization?.description).toBe(expectedVisualization.description);
    expect(visualization?.tags).toEqual(expectedVisualization.tags);
    expect(visualization?.type).toEqual(expectedVisualization.type);
    expect(visualization?.projectName).toBe(expectedVisualization.projectName);
  });
  it("It creates a matrix Visualization XML with all the details in the XML", async () => {

    const filePath = path.resolve(__dirname, "./Matrix_FullDetails.xml");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "text/xml" }];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {};
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.XML };
    const expectedVisualization = {
      data: {
        nodes: [
          {
            name: "Node1",
            category: "1",
            labels: [
              {
                name: "Label1",
                value: 1,
                properties: [
                  {
                    style: [
                      {
                        "font-weight": ["bold"],
                        "background-color": ["#541690"],
                        "background-color1": ["541690"],
                      },
                    ],
                  },
                ],
              },
              {
                name: "Label2",
                value: 0,
                properties: [
                  {
                    style: [
                      {
                        "font-weight": ["bold"],
                        "background-color": ["#541690"],
                        "background-color1": ["541690"],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            name: "Node2",
            category: "2",
            labels: [
              {
                name: "Label3",
                value: 1,
                properties: [
                  {
                    style: [
                      {
                        "font-weight": ["bold"],
                        "background-color": ["#541690"],
                        "background-color1": ["541690"],
                      },
                    ],
                  },
                ],
              },
              {
                name: "Label4",
                value: 0,
                properties: [
                  {
                    style: [
                      {
                        "font-weight": ["bold"],
                        "background-color": ["#541690"],
                        "background-color1": ["541690"],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        links: [
          {
            source: "Node1",
            target: "Node2",
            value: 1,
            properties: [
              {
                style: [
                  {
                    "font-weight": ["bold"],
                    "background-color": ["#541690"],
                    "background-color1": ["541690"],
                  },
                ],
                a: ["b"],
              },
            ],
          },
          {
            source: "Node2",
            target: "Node1",
            value: 1,
            properties: [
              {
                style: [
                  {
                    "font-weight": ["bold"],
                    "background-color": ["#541690"],
                    "background-color1": ["541690"],
                  },
                ],
                a: ["b"],
              },
            ],
          },
        ],
      },
      name: "Matrix_FullDetails",
      description: "Matrix_FullDetails description",
      tags: ["full"],
      type: "matrix",
      projectName: "Test_Project1",
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization?.data).toMatchObject(expectedVisualization?.data as any);
    expect(visualization?.name).toBe(expectedVisualization.name);
    expect(visualization?.description).toBe(expectedVisualization.description);
    expect(visualization?.tags).toEqual(expectedVisualization.tags);
    expect(visualization?.type).toEqual(expectedVisualization.type);
    expect(visualization?.projectName).toBe(expectedVisualization.projectName);
  });
  it("It creates a bar-chart Visualization XML with only the data in the XML", async () => {

    const filePath = path.resolve(__dirname, "./BarChart_PartialDetails.xml");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "text/xml" }];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "BarChart_PartialDetails",
      description: "BarChart_PartialDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.BAR_CHART,
    };
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.XML };
    const expectedVisualization: VisualizationTypes.VisualizationCreate = {
      name: "BarChart_PartialDetails",
      projectName: "Test_Project1",
      type: VisualizationTypes.VisualizationTypesEnum.BAR_CHART,
      data: {
        headers: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        values: {
          Statistic_1: [120, 132, 101, 134, 90, 230, 210],
          Statistic_2: [220, 182, 191, 234, 290, 330, 310],
          Statistic_3: [150, 232, 201, 154, 190, 330, 410],
          Statistic_4: [320, 332, 301, 334, 390, 330, 320],
        },
      },
      description: "BarChart_PartialDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization?.data).toMatchObject(expectedVisualization?.data as any);
    expect(visualization?.name).toBe(expectedVisualization.name);
    expect(visualization?.description).toBe(expectedVisualization.description);
    expect(visualization?.tags).toEqual(expectedVisualization.tags);
    expect(visualization?.type).toEqual(expectedVisualization.type);
    expect(visualization?.projectName).toBe(expectedVisualization.projectName);
  });
  it("It creates a calendar Visualization XML with only the data in the XML", async () => {

    const filePath = path.resolve(__dirname, "./Calendar_PartialDetails.xml");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "text/xml" }];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "Calendar_PartialDetails",
      description: "Calendar_PartialDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.CALENDAR,
    };
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.XML };
    const expectedVisualization = {
      name: "Calendar_PartialDetails",
      projectName: "Test_Project1",
      type: VisualizationTypes.VisualizationTypesEnum.CALENDAR,
      data: {
        calendar: [
          {
            category: "1",
            date: "1939-09-02",
            value: 1,
          },
          {
            category: "2",
            date: "1939-09-07",
            value: 1,
          },
          {
            category: "3",
            date: "1939-09-17",
            value: 1,
          },
          {
            category: "1",
            date: "1939-10-06",
            value: 1,
          },
          {
            category: "1",
            date: "1939-10-07",
            value: 1,
          },
          {
            category: "5",
            date: "1939-10-14",
            value: 1,
          },
          {
            category: "1",
            date: "1939-10-17",
            value: 1,

          },
          {
            category: "6",
            date: "1939-10-22",
            value: 1,

          },
          {
            category: "1",
            date: "1939-10-28",
            value: 1,

          },
          {
            category: "7",
            date: "1939-11-04",
            value: 1,

          },
          {
            category: "3",
            date: "1939-11-28",
            value: 1,

          },
          {
            category: "3",
            date: "1939-12-05",
            value: 1,

          },
          {
            category: "2",
            date: "1939-12-11",
            value: 1,

          },
          {
            category: "2",
            date: "1939-12-16",
            value: 1,

          },
          {
            category: "1",
            date: "1939-12-23",
            value: 1,

          },
        ],
      },
      description: "Calendar_PartialDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization?.data).toMatchObject(expectedVisualization?.data as any);
    expect(visualization?.name).toBe(expectedVisualization.name);
    expect(visualization?.description).toBe(expectedVisualization.description);
    expect(visualization?.tags).toEqual(expectedVisualization.tags);
    expect(visualization?.type).toEqual(expectedVisualization.type);
    expect(visualization?.projectName).toBe(expectedVisualization.projectName);
  });
  it("It creates a forced-directed-graph Visualization XML with only the data in the XML", async () => {

    const filePath = path.resolve(__dirname, "./FLG_PartialDetails.xml");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "text/xml" }];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "FLG_PartialDetails",
      description: "FLG_PartialDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.FORCE_DIRECTED_GRAPH,
    };
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.XML };
    const expectedVisualization = {
      name: "FLG_PartialDetails",
      projectName: "Test_Project1",
      type: VisualizationTypes.VisualizationTypesEnum.FORCE_DIRECTED_GRAPH,
      data: {
        nodes: [
          { name: "Node1", category: "1", },
          { name: "Node2", category: "2", },
          { name: "Node3", category: "3", },
        ],
        links: [
          { source: "Node1", target: "Node2", value: 1 },
          { source: "Node2", target: "Node3", value: 1 },
          { source: "Node3", target: "Node2", value: 1 },
        ],
      },
      description: "FLG_PartialDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization?.data).toMatchObject(expectedVisualization?.data as any);
    expect(visualization?.name).toBe(expectedVisualization.name);
    expect(visualization?.description).toBe(expectedVisualization.description);
    expect(visualization?.tags).toEqual(expectedVisualization.tags);
    expect(visualization?.type).toEqual(expectedVisualization.type);
    expect(visualization?.projectName).toBe(expectedVisualization.projectName);
  });
  it("It creates a funnel Visualization XML with only the data in the XML", async () => {

    const filePath = path.resolve(__dirname, "./Funnel_PartialDetails.xml");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "text/xml" }];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "Funnel_PartialDetails",
      description: "Funnel_PartialDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.FUNNEL,
    };
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.XML };
    const expectedVisualization = {
      name: "Funnel_PartialDetails",
      projectName: "Test_Project1",
      type: "funnel",
      data: {
        values: {
          Statistic_1: 122,
          Statistic_2: 222,
          Statistic_3: 510,
          Statistic_4: 320,
        },
      },
      description: "Funnel_PartialDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization?.data).toMatchObject(expectedVisualization?.data as any);
    expect(visualization?.name).toBe(expectedVisualization.name);
    expect(visualization?.description).toBe(expectedVisualization.description);
    expect(visualization?.tags).toEqual(expectedVisualization.tags);
    expect(visualization?.type).toEqual(expectedVisualization.type);
    expect(visualization?.projectName).toBe(expectedVisualization.projectName);
  });
  it("It creates a hierarchical-edge-bundling Visualization XML with only the data in the XML", async () => {

    const filePath = path.resolve(__dirname, "./HEB_PartialDetails.xml");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "text/xml" }];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "HEB_PartialDetails",
      description: "HEB_PartialDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.HIERARCHICAL_EDGE_BUNDLING,
    };
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.XML };
    const expectedVisualization = {
      name: "HEB_PartialDetails",
      projectName: "Test_Project1",
      type: "hierarchical-edge-bundling",
      data: {
        nodes: [
          { name: "Node1", category: "1", },
          { name: "Node2", category: "2", },
          { name: "Node3", category: "3", },
        ],
        links: [
          { source: "Node1", target: "Node2", value: 1 },
          { source: "Node2", target: "Node3", value: 1 },
          { source: "Node3", target: "Node2", value: 1 },
        ],
      },
      description: "HEB_PartialDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization?.data).toMatchObject(expectedVisualization?.data as any);
    expect(visualization?.name).toBe(expectedVisualization.name);
    expect(visualization?.description).toBe(expectedVisualization.description);
    expect(visualization?.tags).toEqual(expectedVisualization.tags);
    expect(visualization?.type).toEqual(expectedVisualization.type);
    expect(visualization?.projectName).toBe(expectedVisualization.projectName);
  });
  it("It creates a line-chart Visualization XML with only the data in the XML", async () => {

    const filePath = path.resolve(__dirname, "./LineChart_PartialDetails.xml");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "text/xml" }];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "LineChart_PartialDetails",
      description: "LineChart_PartialDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.LINE_CHART,
    };
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.XML };
    const expectedVisualization = {
      name: "LineChart_PartialDetails",
      projectName: "Test_Project1",
      type: "line-chart",
      data: {
        headers: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        values: {
          Statistic_1: [120, 132, 101, 134, 90, 230, 210],
          Statistic_2: [220, 182, 191, 234, 290, 330, 310],
          Statistic_3: [150, 232, 201, 154, 190, 330, 410],
          Statistic_4: [320, 332, 301, 334, 390, 330, 320],
        },
      },
      description: "LineChart_PartialDetails description",
      tags: ["full"],
    };
    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization?.data).toMatchObject(expectedVisualization?.data as any);
    expect(visualization?.name).toBe(expectedVisualization.name);
    expect(visualization?.description).toBe(expectedVisualization.description);
    expect(visualization?.tags).toEqual(expectedVisualization.tags);
    expect(visualization?.type).toEqual(expectedVisualization.type);
    expect(visualization?.projectName).toBe(expectedVisualization.projectName);
  });
  it("It creates a pie-chart Visualization XML with only the data in the XML", async () => {

    const filePath = path.resolve(__dirname, "./PieChart_PartialDetails.xml");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "text/xml" }];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "PieChart_PartialDetails",
      description: "PieChart_PartialDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.PIE_CHART,
    };
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.XML };
    const expectedVisualization = {
      name: "PieChart_PartialDetails",
      projectName: "Test_Project1",
      type: "pie-chart",
      data: {
        values: {
          Statistic_1: 122,
          Statistic_2: 222,
          Statistic_3: 510,
          Statistic_4: 320,
        },
      },
      description: "PieChart_PartialDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization?.data).toMatchObject(expectedVisualization?.data as any);
    expect(visualization?.name).toBe(expectedVisualization.name);
    expect(visualization?.description).toBe(expectedVisualization.description);
    expect(visualization?.tags).toEqual(expectedVisualization.tags);
    expect(visualization?.type).toEqual(expectedVisualization.type);
    expect(visualization?.projectName).toBe(expectedVisualization.projectName);
  });
  it("It creates a sankey Visualization XML with only the data in the XML", async () => {

    const filePath = path.resolve(__dirname, "./Sankey_PartialDetails.xml");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "text/xml" }];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "Sankey_PartialDetails",
      description: "Sankey_PartialDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.SANKEY,
    };
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.XML };
    const expectedVisualization = {
      name: "Sankey_PartialDetails",
      projectName: "Test_Project1",
      type: "sankey",
      data: {
        nodes: [
          { name: "Node1", category: "1", },
          { name: "Node2", category: "2", },
          { name: "Node3", category: "3", },
        ],
        links: [
          { source: "Node1", target: "Node2", value: 1 },
          { source: "Node2", target: "Node3", value: 1 },
        ],
      },
      description: "Sankey_PartialDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization?.data).toMatchObject(expectedVisualization?.data as any);
    expect(visualization?.name).toBe(expectedVisualization.name);
    expect(visualization?.description).toBe(expectedVisualization.description);
    expect(visualization?.tags).toEqual(expectedVisualization.tags);
    expect(visualization?.type).toEqual(expectedVisualization.type);
    expect(visualization?.projectName).toBe(expectedVisualization.projectName);
  });
  it("It creates a scatter Visualization XML with only the data in the XML", async () => {

    const filePath = path.resolve(__dirname, "./Scatter_PartialDetails.xml");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "text/xml" }];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "Scatter_PartialDetails",
      description: "Scatter_PartialDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.SCATTER,
    };
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.XML };
    const expectedVisualization = {
      name: "Scatter_PartialDetails",
      projectName: "Test_Project1",
      type: "scatter",
      data: {
        points: [
          { category: "3", value: [3.275154, 2.957587], },
          { category: "2", value: [-3.344465, 2.603513], },
          { category: "2", value: [0.355083, -3.376585], },
          { category: "1", value: [1.852435, 3.547351], },
          { category: "1", value: [-2.078973, 2.552013], },
        ],
      },
      description: "Scatter_PartialDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization?.data).toMatchObject(expectedVisualization?.data as any);
    expect(visualization?.name).toBe(expectedVisualization.name);
    expect(visualization?.description).toBe(expectedVisualization.description);
    expect(visualization?.tags).toEqual(expectedVisualization.tags);
    expect(visualization?.type).toEqual(expectedVisualization.type);
    expect(visualization?.projectName).toBe(expectedVisualization.projectName);
  });
  it("It creates a sunburst Visualization XML with only the data in the XML", async () => {

    const filePath = path.resolve(__dirname, "./Sunburst_PartialDetails.xml");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "text/xml" }];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "Sunburst_PartialDetails",
      description: "Sunburst_PartialDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.SUNBURST,
    };
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.XML };
    const expectedVisualization = {
      name: "Sunburst_PartialDetails",
      projectName: "Test_Project1",
      type: "sunburst",
      data: {
        nodes: [
          {
            name: "Node Group 1",
            category: "1",
            value: 100,

            children: [
              {
                name: "Node 1",
                category: "2",
                value: 40,

                children: [
                  {
                    name: "Node 1.1",
                    category: "3",
                    value: 20,


                  },
                  {
                    name: "Node 1.2",
                    category: "4",
                    value: 10,


                  },
                ],
              },
              {
                name: "Node 1.1",
                category: "2",
                value: 30,

                children: [
                  {
                    name: "Node 1.1.1",
                    category: "5",
                    value: 15,


                  },
                ],
              },
            ],
          },
          {
            name: "Node group 2",
            category: "6",
            value: 50,

            children: [
              {
                name: "Node 2",
                category: "7",
                value: 25,

                children: [
                  {
                    name: "Node 2.2",
                    category: "8",
                    value: 12,


                  },
                ],
              },
            ],
          },
        ],
      },
      description: "Sunburst_PartialDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization?.data).toMatchObject(expectedVisualization?.data as any);
    expect(visualization?.name).toBe(expectedVisualization.name);
    expect(visualization?.description).toBe(expectedVisualization.description);
    expect(visualization?.tags).toEqual(expectedVisualization.tags);
    expect(visualization?.type).toEqual(expectedVisualization.type);
    expect(visualization?.projectName).toBe(expectedVisualization.projectName);
  });
  it("It creates a treemap Visualization XML with only the data in the XML", async () => {

    const filePath = path.resolve(__dirname, "./Treemap_PartialDetails.xml");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "text/xml" }];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "Treemap_PartialDetails",
      description: "Treemap_PartialDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.TREEMAP,
    };
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.XML };
    const expectedVisualization = {
      name: "Treemap_PartialDetails",
      projectName: "Test_Project1",
      type: "treemap",
      data: {
        nodes: [
          {
            name: "Node Group 1",
            category: "1",
            value: 100,

            children: [
              {
                name: "Node 1",
                category: "2",
                value: 40,

                children: [
                  {
                    name: "Node 1.1",
                    category: "3",
                    value: 20,


                  },
                  {
                    name: "Node 1.2",
                    category: "4",
                    value: 10,


                  },
                ],
              },
              {
                name: "Node 1.1",
                category: "2",
                value: 30,

                children: [
                  {
                    name: "Node 1.1.1",
                    category: "5",
                    value: 15,


                  },
                ],
              },
            ],
          },
          {
            name: "Node group 2",
            category: "6",
            value: 50,

            children: [
              {
                name: "Node 2",
                category: "7",
                value: 25,

                children: [
                  {
                    name: "Node 2.2",
                    category: "8",
                    value: 12,


                  },
                ],
              },
            ],
          },
        ],
      },
      description: "Treemap_PartialDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization?.data).toMatchObject(expectedVisualization?.data as any);
    expect(visualization?.name).toBe(expectedVisualization.name);
    expect(visualization?.description).toBe(expectedVisualization.description);
    expect(visualization?.tags).toEqual(expectedVisualization.tags);
    expect(visualization?.type).toEqual(expectedVisualization.type);
    expect(visualization?.projectName).toBe(expectedVisualization.projectName);
  });
  it("It creates a word-cloud Visualization XML with only the data in the XML", async () => {

    const filePath = path.resolve(__dirname, "./Wordcloud_PartialDetails.xml");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "text/xml" }];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "Wordcloud_PartialDetails",
      description: "Wordcloud_PartialDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.WORD_CLOUD,
    };
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.XML };
    const expectedVisualization = {
      name: "Wordcloud_PartialDetails",
      projectName: "Test_Project1",
      type: "word-cloud",
      data: {
        words: [
          { name: "Word1", value: 390, },
          { name: "Word2", value: 275, },
          { name: "Word3", value: 100, },
          { name: "Word4", value: 1000, },
          { name: "Word5", value: 600, },
          { name: "Word6", value: 146, },
          { name: "Word7", value: 712, },
        ],
      },
      description: "Wordcloud_PartialDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization?.data).toMatchObject(expectedVisualization?.data as any);
    expect(visualization?.name).toBe(expectedVisualization.name);
    expect(visualization?.description).toBe(expectedVisualization.description);
    expect(visualization?.tags).toEqual(expectedVisualization.tags);
    expect(visualization?.type).toEqual(expectedVisualization.type);
    expect(visualization?.projectName).toBe(expectedVisualization.projectName);
  });
  it("It creates a matrix Visualization XML with only the data in the XML", async () => {

    const filePath = path.resolve(__dirname, "./Matrix_PartialDetails.xml");

    const files: FileTypes.FileProperties[] = [{ filePath, type: "text/xml" }];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "Matrix_PartialDetails",
      description: "Matrix_PartialDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.MATRIX,
    };
    const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.XML };
    const expectedVisualization = {
      name: "Matrix_PartialDetails",
      projectName: "Test_Project1",
      type: "matrix",
      data: {
        nodes: [
          {
            name: "Node1",
            category: "1",

            labels: [
              {
                name: "Label1",
                value: 1,
                properties: [
                  {
                    style: [
                      {
                        "font-weight": ["bold"],
                        "background-color": ["#541690"],
                        "background-color1": ["541690"],
                      },
                    ],
                  },
                ],
              },
              {
                name: "Label2",
                value: 0,
                properties: [
                  {
                    style: [
                      {
                        "font-weight": ["bold"],
                        "background-color": ["#541690"],
                        "background-color1": ["541690"],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            name: "Node2",
            category: "2",

            labels: [
              {
                name: "Label3",
                value: 1,
                properties: [
                  {
                    style: [
                      {
                        "font-weight": ["bold"],
                        "background-color": ["#541690"],
                        "background-color1": ["541690"],
                      },
                    ],
                  },
                ],
              },
              {
                name: "Label4",
                value: 0,
                properties: [
                  {
                    style: [
                      {
                        "font-weight": ["bold"],
                        "background-color": ["#541690"],
                        "background-color1": ["541690"],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        links: [
          {
            source: "Node1",
            target: "Node2",
            value: 1,
            properties: [
              {
                style: [
                  {
                    "font-weight": ["bold"],
                    "background-color": ["#541690"],
                    "background-color1": ["541690"],
                  },
                ],
                a: ["b"],
              },
            ],
          },
          {
            source: "Node2",
            target: "Node1",
            value: 1,
            properties: [
              {
                style: [
                  {
                    "font-weight": ["bold"],
                    "background-color": ["#541690"],
                    "background-color1": ["541690"],
                  },
                ],
                a: ["b"],
              },
            ],
          },
        ],
      },
      description: "Matrix_PartialDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization?.data).toMatchObject(expectedVisualization?.data as any);
    expect(visualization?.name).toBe(expectedVisualization.name);
    expect(visualization?.description).toBe(expectedVisualization.description);
    expect(visualization?.tags).toEqual(expectedVisualization.tags);
    expect(visualization?.type).toEqual(expectedVisualization.type);
    expect(visualization?.projectName).toBe(expectedVisualization.projectName);
  });
  it("It creates a word-cloud Visualization EXCEL with all the details in the EXCEL", async () => {

    const filePath = path.resolve(__dirname, "./Wordcloud_FullDetails.xlsx");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      type: VisualizationTypes.VisualizationTypesEnum.WORD_CLOUD,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.EXCEL,
      includeHeaders: false,
      mapping: {
        names: "1",
        values: "2",
        properties: "3",
        visualizationName: "4",
        visualizationDescription: "5",
        visualizationTags: "6",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      data: {
        words: [
          { name: "Word1", value: 390, properties: "prop1" },
          { name: "Word2", value: 40, properties: "prop2" },
        ],
      },
      name: "Wordcloud_FullDetails",
      description: "Wordcloud_FullDetails description",
      tags: ["full"],
      type: "word-cloud",
      projectName: "Test_Project1",
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a forced-directed-graph Visualization EXCEL with all the details in the EXCEL", async () => {

    const filePath = path.resolve(__dirname, "./FLG_FullDetails.xlsx");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      type: VisualizationTypes.VisualizationTypesEnum.FORCE_DIRECTED_GRAPH,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.EXCEL,
      includeHeaders: true,
      mapping: {
        nodes: "1",
        categories: "2",
        properties: "3",
        visualizationName: "4",
        visualizationDescription: "5",
        visualizationTags: "6",
        sources: "7",
        targets: "8",
        values: "9",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "FLG_FullDetails",
      projectName: "Test_Project1",
      type: "force-directed-graph",
      data: {
        nodes: [
          { name: "Node1", category: "1", properties: "prop1" },
          { name: "Node2", category: "2", properties: "prop2" },
          { name: "Node3", category: "3", properties: "prop3" },
        ],
        links: [
          { source: "Node1", target: "Node2", value: 1 },
          { source: "Node2", target: "Node3", value: 1 },
          { source: "Node3", target: "Node2", value: 1 },
        ],
      },
      description: "FLG_FullDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a sankey Visualization EXCEL with all the details in the EXCEL", async () => {

    const filePath = path.resolve(__dirname, "./Sankey_FullDetails.xlsx");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      type: VisualizationTypes.VisualizationTypesEnum.SANKEY,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.EXCEL,
      includeHeaders: true,
      mapping: {
        nodes: "1",
        categories: "2",
        properties: "3",
        visualizationName: "4",
        visualizationDescription: "5",
        visualizationTags: "6",
        sources: "7",
        targets: "8",
        values: "9",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "Sankey_FullDetails",
      projectName: "Test_Project1",
      type: "sankey",
      data: {
        nodes: [
          {
            name: "Node1",
            category: "1",
            properties: "prop1",
          },
          {
            name: "Node2",
            category: "2",
            properties: "prop2",
          },
          {
            name: "Node3",
            category: "3",
            properties: "prop3",
          },
        ],
        links: [
          {
            source: "Node1",
            target: "Node2",
            value: 1,
          },
          {
            source: "Node2",
            target: "Node3",
            value: 1,
          },
        ],
      },
      description: "Sankey_FullDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization).toMatchObject(expectedVisualization);
  });

  it("It creates a hierarchical-edge-bundling Visualization EXCEL with all the details in the EXCEL", async () => {

    const filePath = path.resolve(__dirname, "./HEB_FullDetails.xlsx");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      type: VisualizationTypes.VisualizationTypesEnum.HIERARCHICAL_EDGE_BUNDLING,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.EXCEL,
      includeHeaders: true,
      mapping: {
        nodes: "1",
        categories: "2",
        properties: "3",
        visualizationName: "4",
        visualizationDescription: "5",
        visualizationTags: "6",
        sources: "7",
        targets: "8",
        values: "9",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "HEB_FullDetails",
      projectName: "Test_Project1",
      type: "hierarchical-edge-bundling",
      data: {
        nodes: [
          { name: "Node1", category: "1", properties: "prop1" },
          { name: "Node2", category: "2", properties: "prop2" },
          { name: "Node3", category: "3", properties: "prop3" },
        ],
        links: [
          { source: "Node1", target: "Node2", value: 1 },
          { source: "Node2", target: "Node3", value: 1 },
          { source: "Node3", target: "Node2", value: 1 },
        ],
      },
      description: "HEB_FullDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a calendar Visualization EXCEL with all the details in the EXCEL", async () => {

    const filePath = path.resolve(__dirname, "./Calendar_FullDetails.xlsx");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      type: VisualizationTypes.VisualizationTypesEnum.CALENDAR,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.EXCEL,
      includeHeaders: true,
      mapping: {
        dates: "1",
        values: "2",
        properties: "3",
        visualizationName: "4",
        visualizationDescription: "5",
        visualizationTags: "6",
        categories: "7",
      },
      sheets: "2",
    };
    const expectedVisualization = {
      name: "Calendar_FullDetails",
      projectName: "Test_Project1",
      type: "calendar",
      data: {
        calendar: [
          {
            category: "1",
            date: "1997-10-05",
            value: 1,
            properties: "prop1",
          },
          {
            category: "2",
            date: "1997-11-05",
            value: 2,
            properties: "prop2",
          },
          {
            category: "3",
            date: "1997-12-05",
            value: 3,
            properties: "prop3",
          },
          {
            category: "1",
            date: "1997-05-13",
            value: 1,
            properties: "prop1",
          },
        ],
      },
      description: "Calendar_FullDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    const normalizedVisualization = JSON.parse(JSON.stringify(visualization));
    expect(normalizedVisualization).toMatchObject(expectedVisualization);
  });
  it("It creates a line-chart Visualization EXCEL with all the details in the EXCEL", async () => {

    const filePath = path.resolve(__dirname, "./LineChart_FullDetails.xlsx");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      type: VisualizationTypes.VisualizationTypesEnum.LINE_CHART,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.EXCEL,
      includeHeaders: true,
      mapping: {
        data: "2,3,7,8",
        headers: "1",
        visualizationName: "4",
        visualizationDescription: "5",
        visualizationTags: "6",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "LineChart_FullDetails",
      projectName: "Test_Project1",
      type: "line-chart",
      data: {
        headers: ["1", "2", "3", "4"],
        values: {
          first: [1, 2, 3],
          second: [1, 2, 3],
          third: [1, 2, 3],
          forth: [1, 2, 3],
        },
      },
      description: "LineChart_FullDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a bar-chart Visualization EXCEL with all the details in the EXCEL", async () => {

    const filePath = path.resolve(__dirname, "./BarChart_FullDetails.xlsx");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      type: VisualizationTypes.VisualizationTypesEnum.BAR_CHART,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.EXCEL,
      includeHeaders: true,
      mapping: {
        data: "2,3,7,8",
        headers: "1",
        visualizationName: "4",
        visualizationDescription: "5",
        visualizationTags: "6",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "BarChart_FullDetails",
      projectName: "Test_Project1",
      type: "bar-chart",
      data: {
        headers: ["1", "2", "3", "4"],
        values: {
          first: [1, 2, 3],
          second: [1, 2, 3],
          third: [1, 2, 3],
          forth: [1, 2, 3],
        },
      },
      description: "BarChart_FullDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a pie-chart Visualization EXCEL with all the details in the EXCEL", async () => {

    const filePath = path.resolve(__dirname, "./PieChart_FullDetails.xlsx");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      type: VisualizationTypes.VisualizationTypesEnum.PIE_CHART,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.EXCEL,
      includeHeaders: true,
      mapping: {
        values: "2",
        names: "1",
        visualizationName: "4",
        visualizationDescription: "5",
        visualizationTags: "6",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "PieChart_FullDetails",
      projectName: "Test_Project1",
      type: "pie-chart",
      data: {
        values: {
          first: 1,
          second: 1,
          third: 1,
          forth: 1,
        },
      },
      description: "PieChart_FullDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a scatter Visualization EXCEL with all the details in the EXCEL", async () => {

    const filePath = path.resolve(__dirname, "./Scatter_FullDetails.xlsx");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      type: VisualizationTypes.VisualizationTypesEnum.SCATTER,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.EXCEL,
      includeHeaders: true,
      mapping: {
        values: "2,3",
        categories: "1",
        visualizationName: "4",
        visualizationDescription: "5",
        visualizationTags: "6",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "ScatterChart_FullDetails",
      projectName: "Test_Project1",
      type: "scatter",
      data: {
        points: [
          {
            category: "1",
            value: [1, 2],
            properties: "",
          },
          {
            category: "2",
            value: [1, 2],
            properties: "",
          },
          {
            category: "3",
            value: [1, 2],
            properties: "",
          },
          {
            category: "4",
            value: [1, 2],
            properties: "",
          },
        ],
      },
      description: "ScatterChart_FullDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization).toMatchObject(expectedVisualization);
  });

  it("It creates a treemap Visualization EXCEL with all the details in the EXCEL", async () => {

    const filePath = path.resolve(__dirname, "./Treemap_FullDetails.xlsx");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      type: VisualizationTypes.VisualizationTypesEnum.TREEMAP,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.EXCEL,
      includeHeaders: true,
      mapping: {
        names: "1",
        values: "2",
        categories: "3",
        visualizationName: "4",
        visualizationDescription: "5",
        visualizationTags: "6",
        children: "7,8",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "Treemap_FullDetails_FullDetails",
      projectName: "Test_Project1",
      type: "treemap",
      data: {
        nodes: [
          {
            name: "Node Group 1",
            value: 1,
            category: "2",
            properties: "",
            children: [
              {
                name: "Node 1",
                value: 1,
                category: "2",
                properties: "",
                children: [
                  {
                    name: "Node 1.1",
                    value: 1,
                    category: "2",
                    properties: "",
                  },
                  {
                    name: "Node 1.2",
                    value: 1,
                    category: "2",
                    properties: "",
                  },
                ],
              },
            ],
          },
          {
            name: "Node group 2",
            value: 2,
            category: "5",
            properties: "",
            children: [
              {
                name: "Node 2.2",
                value: 2,
                category: "3",
                properties: "",
              },
            ],
          },
        ],
      },
      description: "Treemap_FullDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a sunburst Visualization EXCEL with all the details in the EXCEL", async () => {

    const filePath = path.resolve(__dirname, "./Sunburst_FullDetails.xlsx");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      type: VisualizationTypes.VisualizationTypesEnum.SUNBURST,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.EXCEL,
      includeHeaders: true,
      mapping: {
        names: "1",
        values: "2",
        categories: "3",
        visualizationName: "4",
        visualizationDescription: "5",
        visualizationTags: "6",
        children: "7,8",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "Sunburst_FullDetails",
      projectName: "Test_Project1",
      type: "sunburst",
      data: {
        nodes: [
          {
            name: "Node Group 1",
            value: 1,
            category: "2",
            properties: "",
            children: [
              {
                name: "Node 1",
                value: 1,
                category: "2",
                properties: "",
                children: [
                  {
                    name: "Node 1.1",
                    value: 1,
                    category: "2",
                    properties: "",
                  },
                  {
                    name: "Node 1.2",
                    value: 1,
                    category: "2",
                    properties: "",
                  },
                ],
              },
            ],
          },
          {
            name: "Node group 2",
            value: 2,
            category: "5",
            properties: "",
            children: [
              {
                name: "Node 2.2",
                value: 2,
                category: "3",
                properties: "",
              },
            ],
          },
        ],
      },
      description: "Sunburst_FullDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a funnel Visualization EXCEL with all the details in the EXCEL", async () => {

    const filePath = path.resolve(__dirname, "./Funnel_FullDetails.xlsx");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      type: VisualizationTypes.VisualizationTypesEnum.FUNNEL,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.EXCEL,
      includeHeaders: true,
      mapping: {
        values: "2",
        names: "1",
        visualizationName: "4",
        visualizationDescription: "5",
        visualizationTags: "6",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "Funnel_FullDetails",
      projectName: "Test_Project1",
      type: "funnel",
      data: {
        values: {
          first: 1,
          second: 1,
          third: 1,
          forth: 1,
        },
      },
      description: "Funnel_FullDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization).toMatchObject(expectedVisualization);
  });

  it("It creates a word-cloud Visualization EXCEL with only the data in the EXCEL", async () => {

    const filePath = path.resolve(__dirname, "./Wordcloud_PartialDetails.xlsx");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "Wordcloud_PartialDetails",
      description: "Wordcloud_PartialDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.WORD_CLOUD,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.EXCEL,
      includeHeaders: false,
      mapping: {
        names: "1",
        values: "2",
        properties: "3",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      data: {
        words: [
          { name: "Word1", value: 390, properties: "prop1" },
          { name: "Word2", value: 40, properties: "prop2" },
        ],
      },
      name: "Wordcloud_PartialDetails",
      description: "Wordcloud_PartialDetails description",
      tags: ["full"],
      type: "word-cloud",
      projectName: "Test_Project1",
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a forced-directed-graph Visualization EXCEL with only the data in the EXCEL", async () => {

    const filePath = path.resolve(__dirname, "./FLG_PartialDetails.xlsx");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "FLG_PartialDetails",
      description: "FLG_PartialDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.FORCE_DIRECTED_GRAPH,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.EXCEL,
      includeHeaders: true,
      mapping: {
        nodes: "1",
        categories: "2",
        properties: "3",
        sources: "7",
        targets: "8",
        values: "9",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "FLG_PartialDetails",
      projectName: "Test_Project1",
      type: "force-directed-graph",
      data: {
        nodes: [
          { name: "Node1", category: "1", properties: "prop1" },
          { name: "Node2", category: "2", properties: "prop2" },
          { name: "Node3", category: "3", properties: "prop3" },
        ],
        links: [
          { source: "Node1", target: "Node2", value: 1 },
          { source: "Node2", target: "Node3", value: 1 },
          { source: "Node3", target: "Node2", value: 1 },
        ],
      },
      description: "FLG_PartialDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a sankey Visualization EXCEL with only the data in the EXCEL", async () => {

    const filePath = path.resolve(__dirname, "./Sankey_PartialDetails.xlsx");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "Sankey_PartialDetails",
      description: "Sankey_PartialDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.SANKEY,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.EXCEL,
      includeHeaders: true,
      mapping: {
        nodes: "1",
        categories: "2",
        properties: "3",
        sources: "7",
        targets: "8",
        values: "9",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "Sankey_PartialDetails",
      projectName: "Test_Project1",
      type: "sankey",
      data: {
        nodes: [
          {
            name: "Node1",
            category: "1",
            properties: "prop1",
          },
          {
            name: "Node2",
            category: "2",
            properties: "prop2",
          },
          {
            name: "Node3",
            category: "3",
            properties: "prop3",
          },
        ],
        links: [
          {
            source: "Node1",
            target: "Node2",
            value: 1,
          },
          {
            source: "Node2",
            target: "Node3",
            value: 1,
          },
        ],
      },
      description: "Sankey_PartialDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization).toMatchObject(expectedVisualization);
  });

  it("It creates a hierarchical-edge-bundling Visualization EXCEL with only the data in the EXCEL", async () => {

    const filePath = path.resolve(__dirname, "./HEB_PartialDetails.xlsx");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "HEB_PartialDetails",
      description: "HEB_PartialDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.HIERARCHICAL_EDGE_BUNDLING,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.EXCEL,
      includeHeaders: true,
      mapping: {
        nodes: "1",
        categories: "2",
        properties: "3",
        sources: "7",
        targets: "8",
        values: "9",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "HEB_PartialDetails",
      projectName: "Test_Project1",
      type: "hierarchical-edge-bundling",
      data: {
        nodes: [
          { name: "Node1", category: "1", properties: "prop1" },
          { name: "Node2", category: "2", properties: "prop2" },
          { name: "Node3", category: "3", properties: "prop3" },
        ],
        links: [
          { source: "Node1", target: "Node2", value: 1 },
          { source: "Node2", target: "Node3", value: 1 },
          { source: "Node3", target: "Node2", value: 1 },
        ],
      },
      description: "HEB_PartialDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a calendar Visualization EXCEL with only the data in the EXCEL", async () => {

    const filePath = path.resolve(__dirname, "./Calendar_PartialDetails.xlsx");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "Calendar_PartialDetails",
      description: "Calendar_PartialDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.CALENDAR,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.EXCEL,
      includeHeaders: true,
      mapping: {
        dates: "1",
        values: "2",
        properties: "3",
        categories: "7",
      },
      sheets: "2",
    };
    const expectedVisualization = {
      name: "Calendar_PartialDetails",
      projectName: "Test_Project1",
      type: "calendar",
      data: {
        calendar: [
          {
            category: "1",
            date: "1997-10-05",
            value: 1,
            properties: "prop1",
          },
          {
            category: "2",
            date: "1997-11-05",
            value: 2,
            properties: "prop2",
          },
          {
            category: "3",
            date: "1997-12-05",
            value: 3,
            properties: "prop3",
          },
          {
            category: "1",
            date: "1997-05-13",
            value: 1,
            properties: "prop1",
          },
        ],
      },
      description: "Calendar_PartialDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    const normalizedVisualization = JSON.parse(JSON.stringify(visualization));
    expect(normalizedVisualization).toMatchObject(expectedVisualization);
  });
  it("It creates a line-chart Visualization EXCEL with only the data in the EXCEL", async () => {

    const filePath = path.resolve(__dirname, "./LineChart_PartialDetails.xlsx");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "LineChart_PartialDetails",
      description: "LineChart_PartialDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.LINE_CHART,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.EXCEL,
      includeHeaders: true,
      mapping: {
        data: "2,3,7,8",
        headers: "1",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "LineChart_PartialDetails",
      projectName: "Test_Project1",
      type: "line-chart",
      data: {
        headers: ["1", "2", "3", "4"],
        values: {
          first: [1, 2, 3],
          second: [1, 2, 3],
          third: [1, 2, 3],
          forth: [1, 2, 3],
        },
      },
      description: "LineChart_PartialDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a bar-chart Visualization EXCEL with only the data in the EXCEL", async () => {

    const filePath = path.resolve(__dirname, "./BarChart_PartialDetails.xlsx");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "BarChart_PartialDetails",
      description: "BarChart_PartialDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.BAR_CHART,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.EXCEL,
      includeHeaders: true,
      mapping: {
        data: "2,3,7,8",
        headers: "1",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "BarChart_PartialDetails",
      projectName: "Test_Project1",
      type: "bar-chart",
      data: {
        headers: ["1", "2", "3", "4"],
        values: {
          first: [1, 2, 3],
          second: [1, 2, 3],
          third: [1, 2, 3],
          forth: [1, 2, 3],
        },
      },
      description: "BarChart_PartialDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a pie-chart Visualization EXCEL with only the data in the EXCEL", async () => {

    const filePath = path.resolve(__dirname, "./PieChart_PartialDetails.xlsx");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "PieChart_PartialDetails",
      description: "PieChart_PartialDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.PIE_CHART,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.EXCEL,
      includeHeaders: true,
      mapping: {
        values: "2",
        names: "1",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "PieChart_PartialDetails",
      projectName: "Test_Project1",
      type: "pie-chart",
      data: {
        values: {
          first: 1,
          second: 1,
          third: 1,
          forth: 1,
        },
      },
      description: "PieChart_PartialDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization).toMatchObject(expectedVisualization);
  });

  it("It creates a scatter Visualization EXCEL with only the data in the EXCEL", async () => {

    const filePath = path.resolve(__dirname, "./Scatter_PartialDetails.xlsx");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "ScatterChart_PartialDetails",
      description: "ScatterChart_PartialDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.SCATTER,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.EXCEL,
      includeHeaders: true,
      mapping: {
        values: "2,3",
        categories: "1",
        visualizationName: "4",
        visualizationDescription: "5",
        visualizationTags: "6",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "ScatterChart_PartialDetails",
      projectName: "Test_Project1",
      type: "scatter",
      data: {
        points: [
          {
            category: "1",
            value: [1, 2],
            properties: "",
          },
          {
            category: "2",
            value: [1, 2],
            properties: "",
          },
          {
            category: "3",
            value: [1, 2],
            properties: "",
          },
          {
            category: "4",
            value: [1, 2],
            properties: "",
          },
        ],
      },
      description: "ScatterChart_PartialDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a treemap Visualization EXCEL with only the data in the EXCEL", async () => {

    const filePath = path.resolve(__dirname, "./Treemap_PartialDetails.xlsx");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "Treemap_PartialDetails",
      description: "Treemap_PartialDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.TREEMAP,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.EXCEL,
      includeHeaders: true,
      mapping: {
        names: "1",
        values: "2",
        categories: "3",

        children: "7,8",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "Treemap_PartialDetails",
      projectName: "Test_Project1",
      type: "treemap",
      data: {
        nodes: [
          {
            name: "Node Group 1",
            value: 1,
            category: "2",
            properties: "",
            children: [
              {
                name: "Node 1",
                value: 1,
                category: "2",
                properties: "",
                children: [
                  {
                    name: "Node 1.1",
                    value: 1,
                    category: "2",
                    properties: "",
                  },
                  {
                    name: "Node 1.2",
                    value: 1,
                    category: "2",
                    properties: "",
                  },
                ],
              },
            ],
          },
          {
            name: "Node group 2",
            value: 2,
            category: "5",
            properties: "",
            children: [
              {
                name: "Node 2.2",
                value: 2,
                category: "3",
                properties: "",
              },
            ],
          },
        ],
      },
      description: "Treemap_PartialDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a sunburst Visualization EXCEL with only the data in the EXCEL", async () => {

    const filePath = path.resolve(__dirname, "./Sunburst_PartialDetails.xlsx");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "Sunburst_PartialDetails",
      description: "Sunburst_PartialDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.SUNBURST,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.EXCEL,
      includeHeaders: true,
      mapping: {
        names: "1",
        values: "2",
        categories: "3",
        children: "7,8",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "Sunburst_PartialDetails",
      projectName: "Test_Project1",
      type: "sunburst",
      data: {
        nodes: [
          {
            name: "Node Group 1",
            value: 1,
            category: "2",
            properties: "",
            children: [
              {
                name: "Node 1",
                value: 1,
                category: "2",
                properties: "",
                children: [
                  {
                    name: "Node 1.1",
                    value: 1,
                    category: "2",
                    properties: "",
                  },
                  {
                    name: "Node 1.2",
                    value: 1,
                    category: "2",
                    properties: "",
                  },
                ],
              },
            ],
          },
          {
            name: "Node group 2",
            value: 2,
            category: "5",
            properties: "",
            children: [
              {
                name: "Node 2.2",
                value: 2,
                category: "3",
                properties: "",
              },
            ],
          },
        ],
      },
      description: "Sunburst_PartialDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a funnel Visualization EXCEL with only the data in the EXCEL", async () => {

    const filePath = path.resolve(__dirname, "./Funnel_PartialDetails.xlsx");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "Funnel_PartialDetails",
      description: "Funnel_PartialDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.FUNNEL,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.EXCEL,
      includeHeaders: true,
      mapping: {
        values: "2",
        names: "1",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "Funnel_PartialDetails",
      projectName: "Test_Project1",
      type: "funnel",
      data: {
        values: {
          first: 1,
          second: 1,
          third: 1,
          forth: 1,
        },
      },
      description: "Funnel_PartialDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a word-cloud Visualization CSV with all the details in the CSV", async () => {

    const filePath = path.resolve(__dirname, "./Wordcloud_FullDetails.csv");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "text/csv",
      },
    ];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      type: VisualizationTypes.VisualizationTypesEnum.WORD_CLOUD,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.CSV,
      includeHeaders: false,
      mapping: {
        names: "1",
        values: "2",
        properties: "3",
        visualizationName: "4",
        visualizationDescription: "5",
        visualizationTags: "6",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      data: {
        words: [
          { name: "Word1", value: 390, properties: "prop1" },
          { name: "Word2", value: 40, properties: "prop2" },
        ],
      },
      name: "Wordcloud_FullDetails",
      description: "Wordcloud_FullDetails description",
      tags: ["full"],
      type: "word-cloud",
      projectName: "Test_Project1",
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a forced-directed-graph Visualization CSV with all the details in the CSV", async () => {

    const filePath = path.resolve(__dirname, "./FLG_FullDetails.csv");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "text/csv",
      },
    ];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      type: VisualizationTypes.VisualizationTypesEnum.FORCE_DIRECTED_GRAPH,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.CSV,
      includeHeaders: true,
      mapping: {
        nodes: "1",
        categories: "2",
        properties: "3",
        visualizationName: "4",
        visualizationDescription: "5",
        visualizationTags: "6",
        sources: "7",
        targets: "8",
        values: "9",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "FLG_FullDetails",
      projectName: "Test_Project1",
      type: "force-directed-graph",
      data: {
        nodes: [
          { name: "Node1", category: "1", properties: "prop1" },
          { name: "Node2", category: "2", properties: "prop2" },
          { name: "Node3", category: "3", properties: "prop3" },
        ],
        links: [
          { source: "Node1", target: "Node2", value: 1 },
          { source: "Node2", target: "Node3", value: 1 },
          { source: "Node3", target: "Node2", value: 1 },
        ],
      },
      description: "FLG_FullDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a sankey Visualization CSV with all the details in the CSV", async () => {

    const filePath = path.resolve(__dirname, "./Sankey_FullDetails.csv");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "text/csv",
      },
    ];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      type: VisualizationTypes.VisualizationTypesEnum.SANKEY,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.CSV,
      includeHeaders: true,
      mapping: {
        nodes: "1",
        categories: "2",
        properties: "3",
        visualizationName: "4",
        visualizationDescription: "5",
        visualizationTags: "6",
        sources: "7",
        targets: "8",
        values: "9",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "Sankey_FullDetails",
      projectName: "Test_Project1",
      type: "sankey",
      data: {
        nodes: [
          {
            name: "Node1",
            category: "1",
            properties: "prop1",
          },
          {
            name: "Node2",
            category: "2",
            properties: "prop2",
          },
          {
            name: "Node3",
            category: "3",
            properties: "prop3",
          },
        ],
        links: [
          {
            source: "Node1",
            target: "Node2",
            value: 1,
          },
          {
            source: "Node2",
            target: "Node3",
            value: 1,
          },
        ],
      },
      description: "Sankey_FullDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization).toMatchObject(expectedVisualization);
  });

  it("It creates a hierarchical-edge-bundling Visualization CSV with all the details in the CSV", async () => {

    const filePath = path.resolve(__dirname, "./HEB_FullDetails.csv");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "text/csv",
      },
    ];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      type: VisualizationTypes.VisualizationTypesEnum.HIERARCHICAL_EDGE_BUNDLING,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.CSV,
      includeHeaders: true,
      mapping: {
        nodes: "1",
        categories: "2",
        properties: "3",
        visualizationName: "4",
        visualizationDescription: "5",
        visualizationTags: "6",
        sources: "7",
        targets: "8",
        values: "9",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "HEB_FullDetails",
      projectName: "Test_Project1",
      type: "hierarchical-edge-bundling",
      data: {
        nodes: [
          { name: "Node1", category: "1", properties: "prop1" },
          { name: "Node2", category: "2", properties: "prop2" },
          { name: "Node3", category: "3", properties: "prop3" },
        ],
        links: [
          { source: "Node1", target: "Node2", value: 1 },
          { source: "Node2", target: "Node3", value: 1 },
          { source: "Node3", target: "Node2", value: 1 },
        ],
      },
      description: "HEB_FullDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a calendar Visualization CSV with all the details in the CSV", async () => {

    const filePath = path.resolve(__dirname, "./Calendar_FullDetails.csv");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "text/csv",
      },
    ];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      type: VisualizationTypes.VisualizationTypesEnum.CALENDAR,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.CSV,
      includeHeaders: true,
      mapping: {
        dates: "1",
        values: "2",
        properties: "3",
        visualizationName: "4",
        visualizationDescription: "5",
        visualizationTags: "6",
        categories: "7",
      },
      sheets: "2",
    };
    const expectedVisualization = {
      name: "Calendar_FullDetails",
      projectName: "Test_Project1",
      type: "calendar",
      data: {
        calendar: [
          {
            category: "1",
            date: "1997-05-13",
            value: 1,
            properties: "prop1",
          },
          {
            category: "2",
            date: "1997-11-05",
            value: 2,
            properties: "prop2",
          },
          {
            category: "3",
            date: "1997-12-05",
            value: 3,
            properties: "prop3",
          },
        ],
      },
      description: "Calendar_FullDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a line-chart Visualization CSV with all the details in the CSV", async () => {

    const filePath = path.resolve(__dirname, "./LineChart_FullDetails.csv");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "text/csv",
      },
    ];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      type: VisualizationTypes.VisualizationTypesEnum.LINE_CHART,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.CSV,
      includeHeaders: true,
      mapping: {
        data: "2,3,7,8",
        headers: "1",
        visualizationName: "4",
        visualizationDescription: "5",
        visualizationTags: "6",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "LineChart_FullDetails",
      projectName: "Test_Project1",
      type: "line-chart",
      data: {
        headers: ["1", "2", "3", "4"],
        values: {
          first: [1, 2, 3],
          second: [1, 2, 3],
          third: [1, 2, 3],
          forth: [1, 2, 3],
        },
      },
      description: "LineChart_FullDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a bar-chart Visualization CSV with all the details in the CSV", async () => {

    const filePath = path.resolve(__dirname, "./BarChart_FullDetails.csv");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "text/csv",
      },
    ];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      type: VisualizationTypes.VisualizationTypesEnum.BAR_CHART,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.CSV,
      includeHeaders: true,
      mapping: {
        data: "2,3,7,8",
        headers: "1",
        visualizationName: "4",
        visualizationDescription: "5",
        visualizationTags: "6",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "BarChart_FullDetails",
      projectName: "Test_Project1",
      type: "bar-chart",
      data: {
        headers: ["1", "2", "3", "4"],
        values: {
          first: [1, 2, 3],
          second: [1, 2, 3],
          third: [1, 2, 3],
          forth: [1, 2, 3],
        },
      },
      description: "BarChart_FullDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a pie-chart Visualization CSV with all the details in the CSV", async () => {

    const filePath = path.resolve(__dirname, "./PieChart_FullDetails.csv");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "text/csv",
      },
    ];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      type: VisualizationTypes.VisualizationTypesEnum.PIE_CHART,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.CSV,
      includeHeaders: true,
      mapping: {
        values: "2",
        names: "1",
        visualizationName: "4",
        visualizationDescription: "5",
        visualizationTags: "6",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "PieChart_FullDetails",
      projectName: "Test_Project1",
      type: "pie-chart",
      data: {
        values: {
          first: 1,
          second: 1,
          third: 1,
          forth: 1,
        },
      },
      description: "PieChart_FullDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a scatter Visualization CSV with all the details in the CSV", async () => {

    const filePath = path.resolve(__dirname, "./Scatter_FullDetails.csv");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "text/csv",
      },
    ];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      type: VisualizationTypes.VisualizationTypesEnum.SCATTER,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.CSV,
      includeHeaders: true,
      mapping: {
        values: "2,3",
        categories: "1",
        visualizationName: "4",
        visualizationDescription: "5",
        visualizationTags: "6",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "ScatterChart_FullDetails",
      projectName: "Test_Project1",
      type: "scatter",
      data: {
        points: [
          {
            category: "1",
            value: [1, 2],
            properties: "",
          },
          {
            category: "2",
            value: [1, 2],
            properties: "",
          },
          {
            category: "3",
            value: [1, 2],
            properties: "",
          },
          {
            category: "4",
            value: [1, 2],
            properties: "",
          },
        ],
      },
      description: "ScatterChart_FullDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization).toMatchObject(expectedVisualization);
  });

  it("It creates a treemap Visualization CSV with all the details in the CSV", async () => {

    const filePath = path.resolve(__dirname, "./Treemap_FullDetails.csv");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "text/csv",
      },
    ];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      type: VisualizationTypes.VisualizationTypesEnum.TREEMAP,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.CSV,
      includeHeaders: true,
      mapping: {
        names: "1",
        values: "2",
        categories: "3",
        visualizationName: "4",
        visualizationDescription: "5",
        visualizationTags: "6",
        children: "7,8",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "TreemapChart_FullDetails",
      projectName: "Test_Project1",
      type: "treemap",
      data: {
        nodes: [
          {
            name: "Node Group 1",
            value: 1,
            category: "2",
            properties: "",
            children: [
              {
                name: "Node 1",
                value: 1,
                category: "2",
                properties: "",
                children: [
                  {
                    name: "Node 1.1",
                    value: 1,
                    category: "2",
                    properties: "",
                  },
                  {
                    name: "Node 1.2",
                    value: 1,
                    category: "2",
                    properties: "",
                  },
                ],
              },
            ],
          },
          {
            name: "Node group 2",
            value: 2,
            category: "5",
            properties: "",
            children: [
              {
                name: "Node 2.2",
                value: 2,
                category: "3",
                properties: "",
              },
            ],
          },
        ],
      },
      description: "TreemapChart_FullDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a sunburst Visualization CSV with all the details in the CSV", async () => {

    const filePath = path.resolve(__dirname, "./Sunburst_FullDetails.csv");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "text/csv",
      },
    ];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      type: VisualizationTypes.VisualizationTypesEnum.SUNBURST,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.CSV,
      includeHeaders: true,
      mapping: {
        names: "1",
        values: "2",
        categories: "3",
        visualizationName: "4",
        visualizationDescription: "5",
        visualizationTags: "6",
        children: "7,8",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "Sunburst_FullDetails",
      projectName: "Test_Project1",
      type: "sunburst",
      data: {
        nodes: [
          {
            name: "Node Group 1",
            value: 1,
            category: "2",
            properties: "",
            children: [
              {
                name: "Node 1",
                value: 1,
                category: "2",
                properties: "",
                children: [
                  {
                    name: "Node 1.1",
                    value: 1,
                    category: "2",
                    properties: "",
                  },
                  {
                    name: "Node 1.2",
                    value: 1,
                    category: "2",
                    properties: "",
                  },
                ],
              },
            ],
          },
          {
            name: "Node group 2",
            value: 2,
            category: "5",
            properties: "",
            children: [
              {
                name: "Node 2.2",
                value: 2,
                category: "3",
                properties: "",
              },
            ],
          },
        ],
      },
      description: "Sunburst_FullDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a funnel Visualization CSV with all the details in the CSV", async () => {

    const filePath = path.resolve(__dirname, "./Funnel_FullDetails.csv");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "text/csv",
      },
    ];
    const allFileDetails: boolean = true;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      type: VisualizationTypes.VisualizationTypesEnum.FUNNEL,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.CSV,
      includeHeaders: true,
      mapping: {
        values: "2",
        names: "1",
        visualizationName: "4",
        visualizationDescription: "5",
        visualizationTags: "6",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "Funnel_FullDetails",
      projectName: "Test_Project1",
      type: "funnel",
      data: {
        values: {
          first: 1,
          second: 1,
          third: 1,
          forth: 1,
        },
      },
      description: "Funnel_FullDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization).toMatchObject(expectedVisualization);
  });

  it("It creates a word-cloud Visualization CSV with only the data in the CSV", async () => {

    const filePath = path.resolve(__dirname, "./Wordcloud_PartialDetails.csv");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "text/csv",
      },
    ];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "Wordcloud_PartialDetails",
      description: "Wordcloud_PartialDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.WORD_CLOUD,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.CSV,
      includeHeaders: false,
      mapping: {
        names: "1",
        values: "2",
        properties: "3",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      data: {
        words: [
          { name: "Word1", value: 390, properties: "prop1" },
          { name: "Word2", value: 40, properties: "prop2" },
        ],
      },
      name: "Wordcloud_PartialDetails",
      description: "Wordcloud_PartialDetails description",
      tags: ["full"],
      type: "word-cloud",
      projectName: "Test_Project1",
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a forced-directed-graph Visualization CSV with only the data in the CSV", async () => {

    const filePath = path.resolve(__dirname, "./FLG_PartialDetails.csv");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "text/csv",
      },
    ];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "FLG_PartialDetails",
      description: "FLG_PartialDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.FORCE_DIRECTED_GRAPH,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.CSV,
      includeHeaders: true,
      mapping: {
        nodes: "1",
        categories: "2",
        properties: "3",
        sources: "7",
        targets: "8",
        values: "9",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "FLG_PartialDetails",
      projectName: "Test_Project1",
      type: "force-directed-graph",
      data: {
        nodes: [
          { name: "Node1", category: "1", properties: "prop1" },
          { name: "Node2", category: "2", properties: "prop2" },
          { name: "Node3", category: "3", properties: "prop3" },
        ],
        links: [
          { source: "Node1", target: "Node2", value: 1 },
          { source: "Node2", target: "Node3", value: 1 },
          { source: "Node3", target: "Node2", value: 1 },
        ],
      },
      description: "FLG_PartialDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a sankey Visualization CSV with only the data in the CSV", async () => {

    const filePath = path.resolve(__dirname, "./Sankey_PartialDetails.csv");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "text/csv",
      },
    ];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "Sankey_PartialDetails",
      description: "Sankey_PartialDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.SANKEY,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.CSV,
      includeHeaders: true,
      mapping: {
        nodes: "1",
        categories: "2",
        properties: "3",
        sources: "7",
        targets: "8",
        values: "9",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "Sankey_PartialDetails",
      projectName: "Test_Project1",
      type: "sankey",
      data: {
        nodes: [
          {
            name: "Node1",
            category: "1",
            properties: "prop1",
          },
          {
            name: "Node2",
            category: "2",
            properties: "prop2",
          },
          {
            name: "Node3",
            category: "3",
            properties: "prop3",
          },
        ],
        links: [
          {
            source: "Node1",
            target: "Node2",
            value: 1,
          },
          {
            source: "Node2",
            target: "Node3",
            value: 1,
          },
        ],
      },
      description: "Sankey_PartialDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization).toMatchObject(expectedVisualization);
  });

  it("It creates a hierarchical-edge-bundling Visualization CSV with only the data in the CSV", async () => {

    const filePath = path.resolve(__dirname, "./HEB_PartialDetails.csv");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "text/csv",
      },
    ];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "HEB_PartialDetails",
      description: "HEB_PartialDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.HIERARCHICAL_EDGE_BUNDLING,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.CSV,
      includeHeaders: true,
      mapping: {
        nodes: "1",
        categories: "2",
        properties: "3",
        sources: "7",
        targets: "8",
        values: "9",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "HEB_PartialDetails",
      projectName: "Test_Project1",
      type: "hierarchical-edge-bundling",
      data: {
        nodes: [
          { name: "Node1", category: "1", properties: "prop1" },
          { name: "Node2", category: "2", properties: "prop2" },
          { name: "Node3", category: "3", properties: "prop3" },
        ],
        links: [
          { source: "Node1", target: "Node2", value: 1 },
          { source: "Node2", target: "Node3", value: 1 },
          { source: "Node3", target: "Node2", value: 1 },
        ],
      },
      description: "HEB_PartialDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a calendar Visualization CSV with only the data in the CSV", async () => {

    const filePath = path.resolve(__dirname, "./Calendar_PartialDetails.csv");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "text/csv",
      },
    ];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "Calendar_PartialDetails",
      description: "Calendar_PartialDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.CALENDAR,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.CSV,
      separator: ",",
      includeHeaders: true,
      mapping: {
        dates: "1",
        values: "2",
        properties: "3",
        categories: "7",
      },
      sheets: "2",
    };
    const expectedVisualization = {
      name: "Calendar_PartialDetails",
      projectName: "Test_Project1",
      type: "calendar",
      data: {
        calendar: [
          {
            category: "1",
            date: "1997-05-13",
            value: 1,
            properties: "prop1",
          },
          {
            category: "2",
            date: "1997-11-05",
            value: 2,
            properties: "prop2",
          },
          {
            category: "3",
            date: "1997-12-05",
            value: 3,
            properties: "prop3",
          },
        ],
      },
      description: "Calendar_PartialDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];
    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a line-chart Visualization CSV with only the data in the CSV", async () => {

    const filePath = path.resolve(__dirname, "./LineChart_PartialDetails.csv");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "text/csv",
      },
    ];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "LineChart_PartialDetails",
      description: "LineChart_PartialDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.LINE_CHART,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.CSV,
      includeHeaders: true,
      mapping: {
        data: "2,3,7,8",
        headers: "1",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "LineChart_PartialDetails",
      projectName: "Test_Project1",
      type: "line-chart",
      data: {
        headers: ["1", "2", "3", "4"],
        values: {
          first: [1, 2, 3],
          second: [1, 2, 3],
          third: [1, 2, 3],
          forth: [1, 2, 3],
        },
      },
      description: "LineChart_PartialDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a bar-chart Visualization CSV with only the data in the CSV", async () => {

    const filePath = path.resolve(__dirname, "./BarChart_PartialDetails.csv");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "text/csv",
      },
    ];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "BarChart_PartialDetails",
      description: "BarChart_PartialDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.BAR_CHART,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.CSV,
      includeHeaders: true,
      mapping: {
        data: "2,3,7,8",
        headers: "1",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "BarChart_PartialDetails",
      projectName: "Test_Project1",
      type: "bar-chart",
      data: {
        headers: ["1", "2", "3", "4"],
        values: {
          first: [1, 2, 3],
          second: [1, 2, 3],
          third: [1, 2, 3],
          forth: [1, 2, 3],
        },
      },
      description: "BarChart_PartialDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a pie-chart Visualization CSV with only the data in the CSV", async () => {

    const filePath = path.resolve(__dirname, "./PieChart_PartialDetails.csv");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "text/csv",
      },
    ];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "PieChart_PartialDetails",
      description: "PieChart_PartialDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.PIE_CHART,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.CSV,
      includeHeaders: true,
      mapping: {
        values: "2",
        names: "1",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "PieChart_PartialDetails",
      projectName: "Test_Project1",
      type: "pie-chart",
      data: {
        values: {
          first: 1,
          second: 1,
          third: 1,
          forth: 1,
        },
      },
      description: "PieChart_PartialDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization).toMatchObject(expectedVisualization);
  });

  it("It creates a scatter Visualization CSV with only the data in the CSV", async () => {

    const filePath = path.resolve(__dirname, "./Scatter_PartialDetails.csv");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "text/csv",
      },
    ];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "ScatterChart_PartialDetails",
      description: "ScatterChart_PartialDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.SCATTER,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.CSV,
      includeHeaders: true,
      mapping: {
        values: "2,3",
        categories: "1",
        visualizationName: "4",
        visualizationDescription: "5",
        visualizationTags: "6",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "ScatterChart_PartialDetails",
      projectName: "Test_Project1",
      type: "scatter",
      data: {
        points: [
          {
            category: "1",
            value: [1, 2],
            properties: "",
          },
          {
            category: "2",
            value: [1, 2],
            properties: "",
          },
          {
            category: "3",
            value: [1, 2],
            properties: "",
          },
          {
            category: "4",
            value: [1, 2],
            properties: "",
          },
        ],
      },
      description: "ScatterChart_PartialDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a treemap Visualization CSV with only the data in the CSV", async () => {

    const filePath = path.resolve(__dirname, "./Treemap_PartialDetails.csv");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "text/csv",
      },
    ];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "Treemap_PartialDetails",
      description: "Treemap_PartialDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.TREEMAP,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.CSV,
      includeHeaders: true,
      mapping: {
        names: "1",
        values: "2",
        categories: "3",

        children: "7,8",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "Treemap_PartialDetails",
      projectName: "Test_Project1",
      type: "treemap",
      data: {
        nodes: [
          {
            name: "Node Group 1",
            value: 1,
            category: "2",
            properties: "",
            children: [
              {
                name: "Node 1",
                value: 1,
                category: "2",
                properties: "",
                children: [
                  {
                    name: "Node 1.1",
                    value: 1,
                    category: "2",
                    properties: "",
                  },
                  {
                    name: "Node 1.2",
                    value: 1,
                    category: "2",
                    properties: "",
                  },
                ],
              },
            ],
          },
          {
            name: "Node group 2",
            value: 2,
            category: "5",
            properties: "",
            children: [
              {
                name: "Node 2.2",
                value: 2,
                category: "3",
                properties: "",
              },
            ],
          },
        ],
      },
      description: "Treemap_PartialDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a sunburst Visualization CSV with only the data in the CSV", async () => {

    const filePath = path.resolve(__dirname, "./Sunburst_PartialDetails.csv");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "text/csv",
      },
    ];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "Sunburst_PartialDetails",
      description: "Sunburst_PartialDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.SUNBURST,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.CSV,
      includeHeaders: true,
      mapping: {
        names: "1",
        values: "2",
        categories: "3",
        children: "7,8",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "Sunburst_PartialDetails",
      projectName: "Test_Project1",
      type: "sunburst",
      data: {
        nodes: [
          {
            name: "Node Group 1",
            value: 1,
            category: "2",
            properties: "",
            children: [
              {
                name: "Node 1",
                value: 1,
                category: "2",
                properties: "",
                children: [
                  {
                    name: "Node 1.1",
                    value: 1,
                    category: "2",
                    properties: "",
                  },
                  {
                    name: "Node 1.2",
                    value: 1,
                    category: "2",
                    properties: "",
                  },
                ],
              },
            ],
          },
          {
            name: "Node group 2",
            value: 2,
            category: "5",
            properties: "",
            children: [
              {
                name: "Node 2.2",
                value: 2,
                category: "3",
                properties: "",
              },
            ],
          },
        ],
      },
      description: "Sunburst_PartialDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It creates a funnel Visualization CSV with only the data in the CSV", async () => {

    const filePath = path.resolve(__dirname, "./Funnel_PartialDetails.csv");

    const files: FileTypes.FileProperties[] = [
      {
        filePath,
        type: "text/csv",
      },
    ];
    const allFileDetails: boolean = false;
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "Funnel_PartialDetails",
      description: "Funnel_PartialDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.FUNNEL,
    };
    const fileDetails: FileTypes.FileDetails = {
      fileType: FileTypes.FileType.CSV,
      includeHeaders: true,
      mapping: {
        values: "2",
        names: "1",
      },
      sheets: "1",
    };
    const expectedVisualization = {
      name: "Funnel_PartialDetails",
      projectName: "Test_Project1",
      type: "funnel",
      data: {
        values: {
          first: 1,
          second: 1,
          third: 1,
          forth: 1,
        },
      },
      description: "Funnel_PartialDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = (
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    )[0];

    expect(visualization).toMatchObject(expectedVisualization);
  });

  it("It finds one visualization", async () => {

    const expectedVisualization = {
      name: "Funnel_PartialDetails",
      projectName: "Test_Project1",
      type: "funnel",
      data: {
        values: {
          first: 1,
          second: 1,
          third: 1,
          forth: 1,
        },
      },
      description: "Funnel_PartialDetails description",
      tags: ["full"],
    };

    const visualization: VisualizationTypes.VisualizationType | null = await factory
      .getBZL()
      .VisualizationBZL.findOne({
        name: "Funnel_PartialDetails",
        type: "funnel",
      });

    expect(visualization).toMatchObject(expectedVisualization);
  });
  it("It browse visualizations with different filters", async () => {
    const expectedVisualization1 = {
      name: "Funnel_PartialDetails",
      type: VisualizationTypes.VisualizationTypesEnum.FUNNEL,
      description: "Funnel_PartialDetails description",
      tags: ["full"],
    };

    const visualization1: VisualizationTypes.ExtendedVisualizationType = await factory
      .getBZL()
      .VisualizationBZL.browse({
        name: "Funnel_PartialDetails",
        type: VisualizationTypes.VisualizationTypesEnum.FUNNEL,
      });
    expect((visualization1.visualizations as VisualizationTypes.VisualizationType[])[0]).toMatchObject(expectedVisualization1);
    const expectedVisualization2 = {
      name: "Funnel_PartialDetails",
      type: VisualizationTypes.VisualizationTypesEnum.FUNNEL,
      description: "Funnel_PartialDetails description",
      tags: ["full"],
    };

    const visualization2: VisualizationTypes.ExtendedVisualizationType = await factory
      .getBZL()
      .VisualizationBZL.browse({
        text: "Funnel_PartialDetails",
      });
    expect((visualization2.visualizations as VisualizationTypes.VisualizationType[])[0]).toMatchObject(expectedVisualization2);
    const visualization3: VisualizationTypes.ExtendedVisualizationType = await factory
      .getBZL()
      .VisualizationBZL.browse({
        text: "randooooom",
      });
    expect((visualization3.visualizations as VisualizationTypes.VisualizationType[]).length === 0).toBe(true);

    const expectedVisualization4 = {
      name: "BarChart_FullDetails",
      type: VisualizationTypes.VisualizationTypesEnum.BAR_CHART,
      description: "BarChart_FullDetails description",
      tags: ["full"],
    };

    const visualization4: VisualizationTypes.ExtendedVisualizationType = await factory
      .getBZL()
      .VisualizationBZL.browse({
        sort: {
          element: "name",
          sortOrder: 1,
        },
      });
    expect((visualization4.visualizations as VisualizationTypes.VisualizationType[])[0]).toMatchObject(expectedVisualization4);
    const visualization5: VisualizationTypes.ExtendedVisualizationType = await factory
      .getBZL()
      .VisualizationBZL.browse({
        page: 1,
        per_page: 1
      });
    expect((visualization5.visualizations as VisualizationTypes.VisualizationType[]).length).toBe(1);
    const visualization6: VisualizationTypes.ExtendedVisualizationType = await factory
      .getBZL()
      .VisualizationBZL.browse({
        page: 1,
      });
    expect((visualization6.visualizations as VisualizationTypes.VisualizationType[]).length).toBe(10);

  });
  it("It delets one visualization", async () => {

    const visualization: boolean = await factory
      .getBZL()
      .VisualizationBZL.delete({
        name: "Funnel_PartialDetails",
        type: "funnel",
      });

    expect(visualization).toBe(true);
  });
  it("Tries to execute any CRUD Operations on a Project that doesn't exist", async () => {
    await Factory.getInstance().getDbaccInstance().Project.delete({
      query: {
        $and: [
          { name: "Test_Project1" }
        ]
      }
    });
    const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
      name: "Sunburst_PartialDetails",
      description: "Sunburst_PartialDetails description",
      tags: ["full"],
      type: VisualizationTypes.VisualizationTypesEnum.SUNBURST,
    };
    try {
      const filePath = path.resolve(__dirname, "./Sunburst_PartialDetails.xml");

      const files: FileTypes.FileProperties[] = [{ filePath, type: "text/xml" }];
      const allFileDetails: boolean = false;
      const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.XML };
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    }
    catch (err) {
      expect((err as Error).message).toBe('No active project')
    }
    try {
      await factory
        .getBZL()
        .VisualizationBZL.findOne({ name: 'Sunburst_PartialDetails' });
    }
    catch (err) {
      expect((err as Error).message).toBe('No active project')
    }
    try {
      await factory
        .getBZL()
        .VisualizationBZL.browse({ name: 'Sunburst_PartialDetails' });
    }
    catch (err) {
      expect((err as Error).message).toBe('No active project')
    }
    try {
      await factory
        .getBZL()
        .VisualizationBZL.update({ name: 'Sunburst_PartialDetails' }, {});
    }
    catch (err) {
      expect((err as Error).message).toBe('Method not implemented.')
    }
    try {
      await factory
        .getBZL()
        .VisualizationBZL.create(visualizationDetails as VisualizationTypes.VisualizationCreate);
    }
    catch (err) {
      expect((err as Error).message).toBe('Method not implemented.')
    }
    try {
      await factory
        .getBZL()
        .VisualizationBZL.delete({ name: 'Sunburst_PartialDetails' });
    }
    catch (err) {
      expect((err as Error).message).toBe('No active project')
    }
    const expectedProject: ProjectTypes.ProjectCreate = {
      name: "Test_Project_Dashboard",
      description: "Test_ProjectDescription1",
      isActive: true,
    };
    await factory.getBZL().ProjectBZL.create(expectedProject);

    try {
      const filePath = path.resolve(__dirname, "./Sunburst_PartialDetails.xml");

      const files: FileTypes.FileProperties[] = [{ filePath, type: "text/xml" }];
      const allFileDetails: boolean = false;
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          {} as FileTypes.FileDetails
        )
    }
    catch (err) {
      expect((err as Error).message).toBe('No file details were provided')
    }

    try {
      const filePath = path.resolve(__dirname, "./Sunburst_PartialDetails.xml");

      const files: FileTypes.FileProperties[] = [{ filePath, type: "text/xml" }];
      const allFileDetails: boolean = false;
      const fileDetails: FileTypes.FileDetails = { fileType: 'faje' as FileTypes.FileType };
      await factory
        .getBZL()
        .VisualizationBZL.createOrUpdateFromFiles(
          files,
          allFileDetails,
          visualizationDetails,
          fileDetails
        )
    }
    catch (err) {
      expect((err as Error).message).toBe('Invalid file type provided')
    }
  })
});

describe("visualizations Providers", () => {

  it('returns null for all providers for unknown type', () => {
    const providerExcelCsv = exelOrCsvdataProvider('fake' as VisualizationTypes.VisualizationTypesEnum, [], false);
    const providerJsonString = jsonDataProvider('fake' as VisualizationTypes.VisualizationTypesEnum, {}, false)
    const providerJsonArray = jsonDataProvider(['fake' as VisualizationTypes.VisualizationTypesEnum], {}, false)
    const providerXML = xmlDataProvider('fake' as VisualizationTypes.VisualizationTypesEnum, {
      root: {
        type: [],
        name: [],
        data: []
      }
    }, false)

    expect(providerExcelCsv).toBe(null);
    expect(providerJsonString).toBe(null);
    expect(providerJsonArray).toBe(null);
    expect(providerXML).toBe(null)
  })
  it('returns null for all transformer provider for unknown type', () => {
    const provider = transformerProvider('fake' as VisualizationTypes.VisualizationTypesEnum, {}, [], false)
    expect(provider).toBe(null);
  })
  it('returns undefined for axis transformations', () => {
    const values = [42, 3.14, "123", 56];
    const mapping = "0,2,3";
    expect(computeAxisChartValues(values, mapping)).toBe(undefined)
  })
  it('returns null  for calendar transformations', () => {
    const invalidReformat = reformatDate("Invalid date format")
    expect(invalidReformat).toBe(null)
  })
  it('returns null for hierarchy transformations', () => {
    const testData1: TransformerTypes.FullNodesDetails[] = [
      { nodes: { name: "Parent", value: "100", category: "A", properties: "", children: ["Child1", "Child2"] } },
      { nodes: { name: "Child3", value: "50", category: "B", properties: "", children: [] } }
    ];

    const testData2: TransformerTypes.FullNodesDetails[] = [
      { nodes: { name: "Parent", value: "100", category: "A", properties: "", children: [] } },
      { nodes: { name: "Child3", value: "50", category: "B", properties: "", children: [] } }
    ];

    const hierarchyExtractorCsvOrExcelTestData1 = hierarchyExtractorCsvOrExcel(testData1)
    expect(hierarchyExtractorCsvOrExcelTestData1).toMatchObject({
      nodes: [
        { name: 'Parent', value: 100, category: 'A', properties: '' },
        { name: 'Child3', value: 50, category: 'B', properties: '' }
      ]
    })
    const hierarchyExtractorCsvOrExcelTestData2 = hierarchyExtractorCsvOrExcel(testData2)
    expect(hierarchyExtractorCsvOrExcelTestData2).toMatchObject(
      {
        nodes: [
          { name: 'Parent', value: 100, category: 'A', properties: '' },
          { name: 'Child3', value: 50, category: 'B', properties: '' }
        ]
      }
    )
  })
  it('uses string as value for scatter transformations', () => {
    const values = [100, 200, 300];
    const mapping = "0,5";
    const result = computeScatterValues(values, mapping);
    expect(result).toMatchObject([100, 0])
  })
})
