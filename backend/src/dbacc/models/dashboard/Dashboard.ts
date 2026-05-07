import { Connection, Model, Schema } from 'mongoose';
import { DashboardTypes } from '@illustry/types';

class Dashboard {
  private readonly connection: Connection;

  private DashboardModel?: Model<DashboardTypes.DashboardType>;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  getModel(): Model<DashboardTypes.DashboardType> {
    if (!this.DashboardModel) {
      const DashboardSchema = new Schema<DashboardTypes.DashboardType>({
        userId: { type: String, required: true },
        shareId: { type: String, required: false },
        sharedWith: {
          type: [{
            userId: { type: String, required: true },
            email: { type: String, required: false },
            name: { type: String, required: false },
            permission: { type: String, enum: ['viewer', 'editor'], required: true },
            status: { type: String, enum: ['pending', 'accepted', 'rejected'], required: false },
            inviteToken: { type: String, required: false },
            inviteExpiresAt: { type: Date, required: false },
            respondedAt: { type: Date, required: false },
            createdAt: { type: Date, required: false },
            updatedAt: { type: Date, required: false }
          }],
          required: false,
          default: []
        },
        projectName: { type: String, required: true },
        name: { type: String, required: true },
        description: {
          type: String,
          required: false,
          maxLength: 250,
          default: ''
        },
        visualizations: { type: Schema.Types.Mixed, required: false },
        layouts: { type: [Schema.Types.Mixed], required: false },
        createdAt: { type: Date, required: false },
        updatedAt: { type: Date, required: false }
      });

      DashboardSchema.index(
        { userId: 1, projectName: 1, name: 1 },
        { unique: true, background: true }
      );
      DashboardSchema.index({ userId: 1, projectName: 1 }, { background: true });
      DashboardSchema.index({ userId: 1, projectName: 1, updatedAt: -1 }, { background: true });
      DashboardSchema.index({ shareId: 1 }, { unique: true, sparse: true, background: true });
      DashboardSchema.index({ 'sharedWith.userId': 1 }, { background: true });
      DashboardSchema.index({ name: 'text', description: 'text' }, { background: true });
      this.DashboardModel = this.connection.model<DashboardTypes.DashboardType>(
        'Dashboard',
        DashboardSchema
      );
    }

    return this.DashboardModel;
  }
}

export default Dashboard;
