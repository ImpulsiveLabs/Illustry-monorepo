import { Connection, Model, Schema } from 'mongoose';
import { VisualizationTypes } from '@illustry/types';

class Visualization {
  private readonly connection: Connection;

  private VisualizationModel?: Model<VisualizationTypes.VisualizationType>;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  getModel(): Model<VisualizationTypes.VisualizationType> {
    if (!this.VisualizationModel) {
      const VisualizationSchema = new Schema<VisualizationTypes.VisualizationType>({
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
        type: {
          type: String,
          required: true
        },
        tags: [{ type: String, required: false }],
        theme: { type: Schema.Types.Mixed, required: false },
        data: { type: Schema.Types.Mixed, required: true },
        createdAt: { type: Date, required: false },
        updatedAt: { type: Date, required: false }
      });

      VisualizationSchema.index(
        { userId: 1, projectName: 1, type: 1, name: 1 },
        { unique: true, background: true }
      );
      VisualizationSchema.index({ userId: 1, projectName: 1, name: 1 }, { background: true });
      VisualizationSchema.index({ userId: 1, projectName: 1, type: 1 }, { background: true });
      VisualizationSchema.index({ userId: 1, projectName: 1, updatedAt: -1 }, { background: true });
      VisualizationSchema.index({ shareId: 1 }, { unique: true, sparse: true, background: true });
      VisualizationSchema.index({ 'sharedWith.userId': 1 }, { background: true });
      VisualizationSchema.index({ name: 'text', description: 'text', tags: 'text' }, { background: true });
      this.VisualizationModel = this.connection.model<VisualizationTypes.VisualizationType>(
        'Visualization',
        VisualizationSchema
      );
    }

    return this.VisualizationModel;
  }
}

export default Visualization;
