import { Connection, Model, Schema } from 'mongoose';
import { PendingRegistration as PendingRegistrationType } from '../../../auth/types';

class PendingRegistration {
  private readonly connection: Connection;

  private pendingRegistrationModel?: Model<PendingRegistrationType>;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  getModel(): Model<PendingRegistrationType> {
    if (this.pendingRegistrationModel === undefined) {
      const PendingRegistrationSchema = new Schema<PendingRegistrationType>(
        {
          email: { type: String, required: true, trim: true },
          emailNormalized: { type: String, required: true, trim: true },
          name: { type: String, required: true, trim: true },
          passwordHash: { type: String, required: true },
          avatarFileName: { type: String, required: false },
          avatarContentType: { type: String, required: false },
          avatarSize: { type: Number, required: false },
          avatarData: { type: Buffer, required: false },
          tokenHash: { type: String, required: true },
          codeHash: { type: String, required: true },
          expiresAt: { type: Date, required: true }
        },
        { timestamps: true }
      );

      PendingRegistrationSchema.index({ emailNormalized: 1 }, { unique: true, background: true });
      PendingRegistrationSchema.index({ tokenHash: 1 }, { unique: true, background: true });
      PendingRegistrationSchema.index({ emailNormalized: 1, codeHash: 1 }, { background: true });
      PendingRegistrationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, background: true });

      this.pendingRegistrationModel = this.connection.model<PendingRegistrationType>('PendingRegistration', PendingRegistrationSchema);
    }

    return this.pendingRegistrationModel;
  }
}

export default PendingRegistration;
