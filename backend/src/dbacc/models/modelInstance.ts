import { Connection, Model } from 'mongoose';
import { ProjectTypes, VisualizationTypes, DashboardTypes } from '@illustry/types';
import Project from './project/Project';
import Visualization from './visualization/Visualization';
import Dashboard from './dashboard/Dashboard';
import User from './auth/User';
import Session from './auth/Session';
import EmailVerificationToken from './auth/EmailVerificationToken';
import PasswordResetToken from './auth/PasswordResetToken';
import { AuthSession, AuthUser, VerificationToken } from '../../auth/types';

class ModelInstance {
  private projectModel?: Model<ProjectTypes.ProjectType>;

  private visualizationModel?: Model<VisualizationTypes.VisualizationType>;

  private dashboardModel?: Model<DashboardTypes.DashboardType>;

  private authUserModel?: Model<AuthUser>;

  private authSessionModel?: Model<AuthSession>;

  private emailVerificationTokenModel?: Model<VerificationToken>;

  private passwordResetTokenModel?: Model<VerificationToken>;

  private readonly connection: Connection;

  private readonly visualization: Visualization;

  private readonly project: Project;

  private readonly dashboard: Dashboard;

  private readonly user: User;

  private readonly session: Session;

  private readonly emailVerificationToken: EmailVerificationToken;

  private readonly passwordResetToken: PasswordResetToken;

  constructor(connection: Connection) {
    this.connection = connection;
    this.connection.setMaxListeners(100);
    this.visualization = new Visualization(this.connection);
    this.project = new Project(this.connection);
    this.dashboard = new Dashboard(this.connection);
    this.user = new User(this.connection);
    this.session = new Session(this.connection);
    this.emailVerificationToken = new EmailVerificationToken(this.connection);
    this.passwordResetToken = new PasswordResetToken(this.connection);
  }

  get ProjectModel(): Model<ProjectTypes.ProjectType> {
    if (!this.projectModel) {
      this.projectModel = this.project.getModel();
    }
    return this.projectModel;
  }

  get VisualizationModel(): Model<VisualizationTypes.VisualizationType> {
    if (!this.visualizationModel) {
      this.visualizationModel = this.visualization.getModel();
    }
    return this.visualizationModel;
  }

  get DashboardModel(): Model<DashboardTypes.DashboardType> {
    if (!this.dashboardModel) {
      this.dashboardModel = this.dashboard.getModel();
    }
    return this.dashboardModel;
  }

  get UserModel(): Model<AuthUser> {
    if (!this.authUserModel) {
      this.authUserModel = this.user.getModel();
    }
    return this.authUserModel;
  }

  get SessionModel(): Model<AuthSession> {
    if (!this.authSessionModel) {
      this.authSessionModel = this.session.getModel();
    }
    return this.authSessionModel;
  }

  get EmailVerificationTokenModel(): Model<VerificationToken> {
    if (!this.emailVerificationTokenModel) {
      this.emailVerificationTokenModel = this.emailVerificationToken.getModel();
    }
    return this.emailVerificationTokenModel;
  }

  get PasswordResetTokenModel(): Model<VerificationToken> {
    if (!this.passwordResetTokenModel) {
      this.passwordResetTokenModel = this.passwordResetToken.getModel();
    }
    return this.passwordResetTokenModel;
  }
}

export default ModelInstance;
