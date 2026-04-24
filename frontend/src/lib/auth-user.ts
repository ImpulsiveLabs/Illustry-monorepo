type CurrentUser = {
  id: string;
  email: string;
  name: string;
  isEmailVerified: boolean;
  roles: string[];
  hasAvatar: boolean;
  avatarUpdatedAt?: string;
  avatarUrl?: string;
};

export type {
  CurrentUser
};
