import DbaccInstance from '../dbacc/lib';
import VisualizationBZL from './visualization/visualization';
import ProjectBZL from './project/project';
import DashboardBZL from './dashboard/dashboard';
import AuthBZL from './auth/auth';

class BZLInstance {
  private dbaccInstance: DbaccInstance;

  private projectBZL!: ProjectBZL;

  private visualizationBZL!: VisualizationBZL;

  private dashboardBZL!: DashboardBZL;

  private authBZL!: AuthBZL;

  constructor(dbaaccInstance: DbaccInstance) {
    this.dbaccInstance = dbaaccInstance;
  }

  get ProjectBZL() {
    if (!this.projectBZL) {
      this.projectBZL = new ProjectBZL(this.dbaccInstance);
    }
    return this.projectBZL;
  }

  get VisualizationBZL() {
    if (!this.visualizationBZL) {
      this.visualizationBZL = new VisualizationBZL(this.dbaccInstance);
    }
    return this.visualizationBZL;
  }

  get DashboardBZL() {
    if (!this.dashboardBZL) {
      this.dashboardBZL = new DashboardBZL(this.dbaccInstance);
    }
    return this.dashboardBZL;
  }

  get AuthBZL() {
    if (!this.authBZL) {
      this.authBZL = new AuthBZL(this.dbaccInstance);
    }
    return this.authBZL;
  }
}

export default BZLInstance;
