import { Connection, Model, Schema } from 'mongoose';
import { VerificationToken } from '../../../auth/types';

class PasswordResetToken {
  private readonly connection: Connection;

  private tokenModel?: Model<VerificationToken>;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  getModel(): Model<VerificationToken> {
    if (this.tokenModel === undefined) {
      const TokenSchema = new Schema<VerificationToken>(
        {
          userId: { type: Schema.Types.ObjectId, required: true, ref: 'AuthUser' },
          tokenHash: { type: String, required: true },
          expiresAt: { type: Date, required: true },
          usedAt: { type: Date, required: false }
        },
        { timestamps: true }
      );

      TokenSchema.index({ tokenHash: 1 }, { unique: true, background: true });
      TokenSchema.index({ userId: 1, createdAt: -1 }, { background: true });
      TokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, background: true });

      this.tokenModel = this.connection.model<VerificationToken>('PasswordResetToken', TokenSchema);
    }

    return this.tokenModel;
  }
}

export default PasswordResetToken;
