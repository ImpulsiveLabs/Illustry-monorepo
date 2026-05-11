type CurrentUser = {
  id: string;
  email: string;
  name: string;
  isEmailVerified: boolean;
  roles: string[];
  hasAvatar: boolean;
  avatarUpdatedAt?: string;
  avatarUrl?: string;
  themeConfig?: Record<string, unknown>;
};

export type {
  CurrentUser
};
