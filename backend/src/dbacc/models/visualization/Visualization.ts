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
      this.VisualizationModel = this.connection.model<VisualizationTypes.VisualizationType>(
        'Visualization',
        VisualizationSchema
      );
    }

    return this.VisualizationModel;
  }
}

export default Visualization;
