import { Connection } from 'mongoose';
import ModelInstance from '../models/modelInstance';
import Visualization from './visualization/visualization';
import Project from './project/project';
import Dashboard from './dashboard/dashboard';
import Auth from './auth/auth';

class DbaccInstance {
  private project!: Project;

  private visualization!: Visualization;

  private dashboard!: Dashboard;

  private auth!: Auth;

  private modelInstance: ModelInstance;

  constructor(dbConnection: Connection) {
    this.modelInstance = new ModelInstance(dbConnection);
  }

  getModelInstance(): ModelInstance {
    return this.modelInstance;
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

  get Auth(): Auth {
    if (!this.auth) {
      this.auth = new Auth(this.modelInstance);
    }
    return this.auth;
  }
}

export default DbaccInstance;
