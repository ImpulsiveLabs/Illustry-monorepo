import { Connection, Model, Schema } from 'mongoose';
import { AuthUserAvatar } from '../../../auth/types';

class UserAvatar {
  private readonly connection: Connection;

  private avatarModel?: Model<AuthUserAvatar>;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  getModel(): Model<AuthUserAvatar> {
    if (this.avatarModel === undefined) {
      const UserAvatarSchema = new Schema<AuthUserAvatar>(
        {
          userId: { type: Schema.Types.ObjectId, required: true, ref: 'AuthUser' },
          fileName: { type: String, required: true },
          contentType: { type: String, required: true },
          size: { type: Number, required: true },
          data: { type: Buffer, required: true }
        },
        { timestamps: true }
      );

      UserAvatarSchema.index({ userId: 1 }, { unique: true, background: true });

      this.avatarModel = this.connection.model<AuthUserAvatar>('AuthUserAvatar', UserAvatarSchema);
    }

    return this.avatarModel;
  }
}

export default UserAvatar;
