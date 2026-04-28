import { Connection, Model, Schema } from 'mongoose';
import { AuthSession } from '../../../auth/types';

class Session {
  private readonly connection: Connection;

  private sessionModel?: Model<AuthSession>;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  getModel(): Model<AuthSession> {
    if (this.sessionModel === undefined) {
      const SessionSchema = new Schema<AuthSession>(
        {
          userId: { type: Schema.Types.ObjectId, required: true, ref: 'AuthUser' },
          sessionTokenHash: { type: String, required: true },
          csrfTokenHash: { type: String, required: true },
          expiresAt: { type: Date, required: true },
          revokedAt: { type: Date, required: false },
          replacedBySessionTokenHash: { type: String, required: false },
          userAgent: { type: String, required: false },
          ipAddress: { type: String, required: false },
          authVersion: { type: Number, required: true, default: 0 }
        },
        { timestamps: true }
      );

      SessionSchema.index({ sessionTokenHash: 1 }, { unique: true, background: true });
      SessionSchema.index({ userId: 1, expiresAt: -1 }, { background: true });
      SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, background: true });

      this.sessionModel = this.connection.model<AuthSession>('AuthSession', SessionSchema);
    }

    return this.sessionModel;
  }
}

export default Session;
