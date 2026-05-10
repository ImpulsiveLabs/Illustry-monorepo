import {
  ProjectTypes
} from "@illustry/types";
import Factory from "../../src/factory";

process.env.NODE_ENV = "test";
process.env.MONGO_TEST_URL = "mongodb://localhost:27017/illustrytest";
process.env.MONGO_USER = "root"
process.env.MONGO_PASSWORD = "rootPass"
process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS = "5000";
process.env.MONGO_CONNECT_TIMEOUT_MS = "5000";
process.env.MONGO_SOCKET_TIMEOUT_MS = "5000";
process.env.MONGO_QUERY_TIMEOUT_MS = "5000";

const factory = Factory.getInstance();

describe("project CRUD", () => {
  beforeAll(async () => {
    await factory.connect();
    await factory.getBZL().ProjectBZL.delete({ name: "Test_Project1" }).catch(() => undefined);
    await factory.getBZL().ProjectBZL.delete({ name: "Test_Project2" }).catch(() => undefined);
  });

  afterAll(async () => {
    const allProjects = await factory.getBZL().ProjectBZL.browse({});

    const deletePromises = (allProjects.projects || []).map(async (project) => {
      await factory.getBZL().ProjectBZL.delete({ name: project.name });
    });

    await Promise.all(deletePromises);
    await factory.cleanup();
    delete process.env.NODE_ENV;
  });

  it("create a project", async () => {

    const expectedProject: ProjectTypes.ProjectCreate = {
      name: "Test_Project1",
      description: "Test_ProjectDescription1",
    };
    const project: ProjectTypes.ProjectType = await factory
      .getBZL()
      .ProjectBZL.create(expectedProject);

    expect(project).not.toBeNull();
    if (project) {
      expect(project.createdAt).toBeDefined();
      expect(project.updatedAt).toBeDefined();
      expect(project.isActive).toBe(false);
      expect(project).toMatchObject(expectedProject);
    }
  });

  it("creates the same project twice", async () => {

    const expectedProject: ProjectTypes.ProjectCreate = {
      name: "Test_Project2",
      description: "Test_ProjectDescription2",
      isActive: true,
    };
    const project: ProjectTypes.ProjectType = await factory
      .getBZL()
      .ProjectBZL.create(expectedProject);

    expect(project).not.toBeNull();
    if (project) {
      expect(project.createdAt).toBeDefined();
      expect(project.updatedAt).toBeDefined();
      expect(project.isActive).toBe(true);
      expect(project).toMatchObject(expectedProject);
    }

    try {
      await factory.getBZL().ProjectBZL.create(expectedProject);
    } catch (error) {
      expect(error).toBeDefined();
      const castedError = error as Error;
      expect(castedError.message).toContain(
        "There already is a project named Test_Project2"
      );
    }
  });

  it("update a project with is active true", async () => {

    const expectedProject: ProjectTypes.ProjectUpdate = {
      name: 'Test_Project1',
      description: "Test_ProjectDescription1_1",
      isActive: true,
    };
    const project: ProjectTypes.ProjectType | null = await factory
      .getBZL()
      .ProjectBZL.update({ name: "Test_Project1" }, expectedProject);

    // Check if project is not null before accessing its properties
    expect(project).not.toBeNull();
    if (project) {
      expect(project.createdAt).toBeDefined();
      expect(project.updatedAt).toBeDefined();
      expect(project.isActive).toBe(true);
      expect(project).toMatchObject(expectedProject);
    }
  });

  it("update a project with is active false", async () => {
    const expectedProject: ProjectTypes.ProjectUpdate = {
      name: "Test_Project2",
      description: "Test_ProjectDescription2",
      isActive: false,
    };
    const project: ProjectTypes.ProjectType | null = await factory
      .getBZL()
      .ProjectBZL.update({ name: "Test_Project2" }, expectedProject);

    // Check if project is not null before accessing its properties
    expect(project).not.toBeNull();
    if (project) {
      expect(project.createdAt).toBeDefined();
      expect(project.updatedAt).toBeDefined();
      expect(project.isActive).toBe(false);
      expect(project).toMatchObject(expectedProject);
    }
  });

  it("update a non existing project", async () => {

    const expectedProject: ProjectTypes.ProjectUpdate = {
      description: "Test_ProjectDescription1_1",
      isActive: false,
    };
    try {
      await factory
        .getBZL()
        .ProjectBZL.update({ name: "Fake_Name" }, expectedProject);
    } catch (error) {
      expect(error).toBeDefined();
      const castedError = error as Error;
      expect(castedError.message).toContain(
        "No project was found with name Fake_Name"
      );
    }
  });

  it("finds a project by name", async () => {

    const expectedProject: ProjectTypes.ProjectCreate = {
      name: "Test_Project2",
      description: "Test_ProjectDescription2",
    };
    const project: ProjectTypes.ProjectType = await factory
      .getBZL()
      .ProjectBZL.findOne({ name: "Test_Project2" });

    expect(project).not.toBeNull();
    if (project) {
      expect(project.createdAt).toBeDefined();
      expect(project.updatedAt).toBeDefined();
      expect(project.isActive).toBe(false);
      expect(project).toMatchObject(expectedProject);
    }
    try {
      await factory
        .getBZL()
        .ProjectBZL.findOne({ name: "Test_Project50000" });
    } catch (err) {
      expect((err as Error).message).toBe('No project was found with name Test_Project50000')
    }
  });

  it("browse projects by all filter", async () => {

    const expectedProject1: ProjectTypes.ProjectCreate = {
      name: "Test_Project1",
      description: "Test_ProjectDescription1_1",
    };
    const expectedProject2: ProjectTypes.ProjectCreate = {
      name: "Test_Project2",
      description: "Test_ProjectDescription2",
    };

    const projects1: ProjectTypes.ExtendedProjectType = await factory
      .getBZL()
      .ProjectBZL.browse({ name: "Test_Project2" });

    expect(projects1.projects).toBeDefined();
    if (projects1.projects && projects1.projects.length > 0) {
      expect((projects1.projects[0] as ProjectTypes.ProjectType)).toMatchObject(expectedProject2);
    }

    const projects2: ProjectTypes.ExtendedProjectType = await factory
      .getBZL()
      .ProjectBZL.browse({ text: "2" });

    expect(projects2.projects).toBeDefined();
    if (projects2.projects && projects2.projects.length > 0) {
      expect((projects2.projects[0] as ProjectTypes.ProjectType)).toMatchObject(expectedProject2);
    }

    const projects3: ProjectTypes.ExtendedProjectType = await factory
      .getBZL()
      .ProjectBZL.browse({ text: "3" });

    expect(projects3.projects).toBeDefined();
    if (projects3.projects && projects3.projects.length === 0) {
      expect((projects3.projects as ProjectTypes.ProjectType[]).length).toBe(0);
    }

    const projects4: ProjectTypes.ExtendedProjectType = await factory
      .getBZL()
      .ProjectBZL.browse({
        sort: {
          element: "name",
          sortOrder: -1,
        },
      });

    expect(projects4.projects).toBeDefined();
    if (projects4.projects && projects4.projects.length > 0) {
      expect((projects4.projects[0] as ProjectTypes.ProjectType)).toMatchObject(expectedProject2);
    }

    const projects5: ProjectTypes.ExtendedProjectType = await factory
      .getBZL()
      .ProjectBZL.browse({
        isActive: true,
      });

    expect(projects5.projects).toBeDefined();
    if (projects5.projects && projects5.projects.length > 0) {
      expect((projects5.projects[0] as ProjectTypes.ProjectType)).toMatchObject(expectedProject1);
    }
    const projects6: ProjectTypes.ExtendedProjectType = await factory
      .getBZL()
      .ProjectBZL.browse({
        page: 1,
        per_page:1
      });

    expect(projects6.projects?.length).toBe(1);
    const projects7: ProjectTypes.ExtendedProjectType = await factory
      .getBZL()
      .ProjectBZL.browse({
        page: 1,
      });

    expect(projects7.projects?.length).toBe(3);
    
  });

  it("deletes a project", async () => {
    const project: boolean = await factory
      .getBZL()
      .ProjectBZL.delete({ name: "Test_Project2" });
    expect(project).toBe(true);
  });
});
