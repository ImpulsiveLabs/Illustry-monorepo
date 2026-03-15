import { Connection } from 'mongoose';
import ModelInstance from '../models/modelInstance';
import Visualization from './visualization/visualization';
import Project from './project/project';
import Dashboard from './dashboard/dashboard';

class DbaccInstance {
  private project!: Project;

  private visualization!: Visualization;

  private dashboard!: Dashboard;

  private modelInstance: ModelInstance;

  constructor(dbConnection: Connection) {
    this.modelInstance = new ModelInstance(dbConnection);
  }

  get Project(): Project {
    if (!this.project) {
      this.project = new Project(this.modelInstance);
    }
    return this.project;
  }

  get Visualization(): Visualization {
    if (!this.visualization) {
      this.visualization = new Visualization(this.modelInstance);
    }
    return this.visualization;
  }

  get Dashboard(): Dashboard {
    if (!this.dashboard) {
      this.dashboard = new Dashboard(this.modelInstance);
    }
    return this.dashboard;
  }
}

export default DbaccInstance;
