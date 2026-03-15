import mongoose from "mongoose";
import {
    DashboardTypes,
    FileTypes,
    ProjectTypes,
    VisualizationTypes
} from "@illustry/types";
import Factory from "../../src/factory";
import path from "path";
import * as fs from 'fs';
process.env.NODE_ENV = "test";
process.env.MONGO_TEST_URL = "mongodb://localhost:27017/illustrytest";
process.env.MONGO_USER = "root"
process.env.MONGO_PASSWORD = "rootPass"

const factory = Factory.getInstance();

describe("dashboard CRUD", () => {
    beforeAll(async () => {
        await factory.getBZL().ProjectBZL.delete({ name: "Test_Project_Dashboard" }).catch(() => undefined);
        const expectedProject: ProjectTypes.ProjectCreate = {
            name: "Test_Project_Dashboard",
            description: "Test_ProjectDescription1",
            isActive: true,
        };
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

    it("create a dashboard", async () => {

        const expectedDashboard: DashboardTypes.DashboardCreate = {
            name: "Test_dashboard55",
            description: "Test_dashboardDescription1",
            projectName: 'Test_Project_Dashboard'
        };
        const dashboard: DashboardTypes.DashboardType = await factory
            .getBZL()
            .DashboardBZL.create(expectedDashboard);
        expect(dashboard).not.toBeNull();
        if (dashboard) {
            expect(dashboard.createdAt).toBeDefined();
            expect(dashboard.updatedAt).toBeDefined();
            expect(dashboard).toMatchObject(expectedDashboard);
        }
    });

    it("creates the same dashboard twice", async () => {

        const expectedDashboard: DashboardTypes.DashboardCreate = {
            name: "Test_dashboard2",
            description: "Test_dashboardDescription2",
            projectName: 'Test_Project_Dashboard'
        };
        const dashboard: DashboardTypes.DashboardType = await factory
            .getBZL()
            .DashboardBZL.create(expectedDashboard);


        expect(dashboard).not.toBeNull();
        if (dashboard) {
            expect(dashboard.createdAt).toBeDefined();
            expect(dashboard.updatedAt).toBeDefined();
            expect(dashboard).toMatchObject(expectedDashboard);
        }

        try {
            await factory.getBZL().DashboardBZL.create(expectedDashboard);
        } catch (error) {
            expect(error).toBeDefined();
            const castedError = error as Error;
            expect(castedError.message).toContain(
                "There already is a Dashboard named Test_dashboard2"
            );
        }
    });

    it("finds a dashboard by name", async () => {
        const expectedDashboard: DashboardTypes.DashboardCreate = {
            name: "Test_dashboard2",
            description: "Test_dashboardDescription2",
            projectName: 'Test_Project_Dashboard'
        };
        const dashboard: DashboardTypes.DashboardType = await factory
            .getBZL()
            .DashboardBZL.findOne({ name: "Test_dashboard2" }, true);

        expect(dashboard).not.toBeNull();
        if (dashboard) {
            expect(dashboard.createdAt).toBeDefined();
            expect(dashboard.updatedAt).toBeDefined();
            expect(dashboard).toMatchObject(expectedDashboard);
        }
        try {
            await factory
                .getBZL()
                .DashboardBZL.findOne({ name: "Test_dashboard100" }, true);
        } catch (err) {
            expect((err as Error).message).toBe('No Dashboard was found with name Test_dashboard100')
        }
    });

    it("browse dashboards by all filter", async () => {
        const dashboards1: DashboardTypes.ExtendedDashboardType = await factory
            .getBZL()
            .DashboardBZL.browse({ name: "Test_dashboard2" });

        expect(dashboards1.dashboards).toBeDefined();
        if (dashboards1.dashboards && dashboards1.dashboards.length > 0) {
            expect((dashboards1.dashboards[0] as DashboardTypes.DashboardType).name).toBe('Test_dashboard2');
        }

        const dashboards2: DashboardTypes.ExtendedDashboardType = await factory
            .getBZL()
            .DashboardBZL.browse({ text: "2" });

        expect(dashboards2.dashboards).toBeDefined();
        if (dashboards2.dashboards && dashboards2.dashboards.length > 0) {
            expect((dashboards2.dashboards[0] as DashboardTypes.DashboardType).name).toBe('Test_dashboard2');

        }

        const dashboards3: DashboardTypes.ExtendedDashboardType = await factory
            .getBZL()
            .DashboardBZL.browse({ text: "3" });

        expect(dashboards3.dashboards).toBeDefined();
        if (dashboards3.dashboards && dashboards3.dashboards.length === 0) {
            expect((dashboards3.dashboards as DashboardTypes.DashboardType[]).length).toBe(0);
        }

        const dashboards4: DashboardTypes.ExtendedDashboardType = await factory
            .getBZL()
            .DashboardBZL.browse({
                sort: {
                    element: "name",
                    sortOrder: -1,
                },
            });

        expect(dashboards4.dashboards).toBeDefined();
        if (dashboards4.dashboards && dashboards4.dashboards.length > 0) {
            expect((dashboards4.dashboards[0] as DashboardTypes.DashboardType).name).toBe('Test_dashboard55');
        }

        const dashboards5: DashboardTypes.ExtendedDashboardType = await factory
            .getBZL()
            .DashboardBZL.browse({
                isActive: true,
            });

        expect(dashboards5.dashboards).toBeDefined();
        if (dashboards5.dashboards && dashboards5.dashboards.length > 0) {
            expect((dashboards5.dashboards[0] as DashboardTypes.DashboardType).name).toBe('Test_dashboard2');
        }

        const dashboards6: DashboardTypes.ExtendedDashboardType = await factory
            .getBZL()
            .DashboardBZL.browse({
                page: 1,
                per_page: 1
            });

        expect(dashboards6.dashboards?.length).toBe(1);

        const dashboards7: DashboardTypes.ExtendedDashboardType = await factory
            .getBZL()
            .DashboardBZL.browse({
                page: 1,
            });

        expect(dashboards7.dashboards?.length).toBe(2);
    });
    it("It creates a funnel Visualization JSON with all the details in the JSON and attach it to a dashboard and delete it afterwards", async () => {
        const funelDetails = path.resolve(
            __dirname,
            "../../__tests_resources__/json/Funnel_FullDetails.json"
        );
        await fs.promises.copyFile(funelDetails, path.resolve(__dirname, 'Funnel_FullDetails.json'));
        const filePath = path.resolve(__dirname, "./Funnel_FullDetails.json");

        const files: FileTypes.FileProperties[] = [{ filePath, type: "application/json" }];
        const allFileDetails: boolean = true;
        const visualizationDetails: VisualizationTypes.VisualizationUpdate = {};
        const fileDetails: FileTypes.FileDetails = { fileType: FileTypes.FileType.JSON };
        const expectedVisualization: VisualizationTypes.VisualizationCreate = {
            projectName: "Test_Project_Dashboard",
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
        await Factory.getInstance().getBZL().DashboardBZL.update({ name: 'Test_dashboard2' }, { visualizations: { 'Funnel_FullDetails': VisualizationTypes.VisualizationTypesEnum.FUNNEL } })

        const foundDash = await Factory.getInstance().getBZL().DashboardBZL.findOne({ name: 'Test_dashboard2', projectName: 'Test_Project_Dashboard', }, true)

        expect(foundDash.visualizations?.length).toBe(1);
        await factory.getBZL()
            .VisualizationBZL
            .delete({ projectName: visualization?.projectName, name: visualization?.name });
        const foundDashWithoutVis = await Factory.getInstance().getBZL().DashboardBZL.findOne({ name: 'Test_dashboard2', projectName: 'Test_Project_Dashboard', }, true)
        expect(foundDashWithoutVis.visualizations?.length).toBe(0);
    });

    it("deletes a dashboard", async () => {
        const dashboard: boolean = await factory
            .getBZL()
            .DashboardBZL.delete({ name: "Test_dashboard2" });
        expect(dashboard).toBe(true);
    });

    it("Tries to execute any CRUD Operations on a Project that doesn't exist", async () => {
        await Factory.getInstance().getDbaccInstance().Project.delete({
            query: {
                $and: [
                    { name: "Test_Project_Dashboard" }
                ]
            }
        });
        try {
            const expectedDashboard: DashboardTypes.DashboardCreate = {
                name: "Test_dashboard100",
                description: "Test_dashboardDescription1",
                projectName: 'Test_Project_Dashboard'
            };
            await factory
                .getBZL()
                .DashboardBZL.create(expectedDashboard);
        }
        catch (err) {
            expect((err as Error).message).toBe('No active project')
        }
        try {
            await factory
                .getBZL()
                .DashboardBZL.findOne({ name: 'Test_dashboard100' });
        }
        catch (err) {
            expect((err as Error).message).toBe('No active project')
        }
        try {
            await factory
                .getBZL()
                .DashboardBZL.browse({ name: 'Test_dashboard100' });
        }
        catch (err) {
            expect((err as Error).message).toBe('No active project')
        }
        try {
            await factory
                .getBZL()
                .DashboardBZL.update({ name: 'Test_dashboard100' }, {});
        }
        catch (err) {
            expect((err as Error).message).toBe('No active project')
        }
        try {
            await factory
                .getBZL()
                .DashboardBZL.delete({ name: 'Test_dashboard100' });
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
    })

    it("Update a dashboard with only layouts", async () => {

        const expectedDashboard: DashboardTypes.DashboardCreate = {
            name: "Test_dashboard5555",
            description: "Test_dashboardDescription1",
            projectName: 'Test_Project_Dashboard',
            layouts: [{
                i: '1',
                x: 1,
                y: 1,
                w: 1,
                h: 1,
                minW: 1,
                minH: 1
            }]
        };
        const dashboard: DashboardTypes.DashboardType = await factory
            .getBZL()
            .DashboardBZL.create(expectedDashboard);
        expect(dashboard).not.toBeNull();
        if (dashboard) {
            expect(dashboard.createdAt).toBeDefined();
            expect(dashboard.updatedAt).toBeDefined();
            expect(dashboard).toMatchObject(expectedDashboard);
        }
        expectedDashboard.layouts = [];
        expectedDashboard.description = 'I will not change'
        const updatedDash: DashboardTypes.DashboardType = await factory
            .getBZL()
            .DashboardBZL.update({ name: "Test_dashboard5555" }, expectedDashboard) as DashboardTypes.DashboardType;
        if (updatedDash) {
            expect(updatedDash.layouts?.length).toBe(0)
            expect(updatedDash.description).toBe('Test_dashboardDescription1')
        }

    });
});
