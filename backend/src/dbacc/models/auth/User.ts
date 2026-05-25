import { Connection, Model, Schema } from 'mongoose';
import { AuthUser } from '../../../auth/types';

class User {
  private readonly connection: Connection;

  private userModel?: Model<AuthUser>;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  getModel(): Model<AuthUser> {
    if (this.userModel === undefined) {
      const UserSchema = new Schema<AuthUser>(
        {
          email: { type: String, required: true, trim: true },
          emailNormalized: { type: String, required: true, trim: true },
          name: { type: String, required: true, trim: true },
          passwordHash: { type: String, required: true },
          avatarFileName: { type: String, required: false },
          avatarContentType: { type: String, required: false },
          avatarUpdatedAt: { type: Date, required: false },
          isEmailVerified: { type: Boolean, required: true, default: false },
          roles: { type: [String], required: true, default: ['user'] },
          authVersion: { type: Number, required: true, default: 0 },
          themeConfig: { type: Schema.Types.Mixed, required: false }
        },
        { timestamps: true }
      );

      UserSchema.index({ emailNormalized: 1 }, { unique: true, background: true });

      this.userModel = this.connection.model<AuthUser>('AuthUser', UserSchema);
    }

    return this.userModel;
  }
}

export default User;
