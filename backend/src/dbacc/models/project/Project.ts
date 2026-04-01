import { Connection, Model, Schema } from 'mongoose';
import { ProjectTypes } from '@illustry/types';

class Project {
  private readonly connection: Connection;

  private projectModel?: Model<ProjectTypes.ProjectType>;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  getModel(): Model<ProjectTypes.ProjectType> {
    if (!this.projectModel) {
      const ProjectSchema = new Schema<ProjectTypes.ProjectType>({
        userId: { type: String, required: true },
        name: { type: String, required: true },
        description: {
          type: String, required: false, maxLength: 50, default: ''
        },
        createdAt: { type: Date, required: false },
        updatedAt: { type: Date, required: false },
        isActive: { type: Boolean, required: true, default: false }
      });

      ProjectSchema.index({ userId: 1, name: 1 }, { unique: true, background: true });
      ProjectSchema.index({ userId: 1, isActive: 1 }, { background: true });
      ProjectSchema.index({ userId: 1, name: 'text', description: 'text' });

      this.projectModel = this.connection.model<ProjectTypes.ProjectType>(
        'Project',
        ProjectSchema
      );
    }

    return this.projectModel;
  }
}

export default Project;
