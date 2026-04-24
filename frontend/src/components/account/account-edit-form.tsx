'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, KeyRound, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import Separator from '@/components/ui/separator';
import { useLocale } from '@/components/providers/locale-provider';
import { changePassword, updateProfile } from '@/lib/auth-client';
import type { CurrentUser } from '@/app/_actions/auth';

type AccountEditFormProps = {
  user: CurrentUser;
};

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const toSafeAvatarUrl = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol === 'blob:' || parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return encodeURI(parsed.toString());
    }
  } catch {
    return null;
  }

  return null;
};

const getInitials = (name: string, email: string) => {
  const source = name.trim() || email;
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
};

const AccountEditForm = ({ user }: AccountEditFormProps) => {
  const router = useRouter();
  const { t } = useLocale();
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [profilePending, setProfilePending] = useState(false);
  const [removeAvatarPending, setRemoveAvatarPending] = useState(false);
  const [passwordPending, setPasswordPending] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!avatar) {
      setAvatarPreviewUrl(null);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(avatar);
    setAvatarPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [avatar]);

  const displayAvatarUrl = toSafeAvatarUrl(avatarPreviewUrl || user.avatarUrl);
  const passwordRules = useMemo(() => [
    { id: 'min-length', label: t('auth.register.passwordRule.minLength'), valid: newPassword.length >= 12 },
    { id: 'uppercase', label: t('auth.register.passwordRule.uppercase'), valid: /[A-Z]/.test(newPassword) },
    { id: 'lowercase', label: t('auth.register.passwordRule.lowercase'), valid: /[a-z]/.test(newPassword) },
    { id: 'digit', label: t('auth.register.passwordRule.digit'), valid: /\d/.test(newPassword) },
    { id: 'special', label: t('auth.register.passwordRule.special'), valid: /[^A-Za-z0-9]/.test(newPassword) }
  ], [newPassword, t]);
  const passwordsMatch = useMemo(
    () => newPassword.length > 0 && newPassword === confirmPassword,
    [confirmPassword, newPassword]
  );
  const isPasswordStrong = passwordRules.every((rule) => rule.valid);
  const profileChanged = useMemo(
    () => name.trim() !== user.name || avatar !== null,
    [avatar, name, user.name]
  );

  const onAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextAvatar = event.target.files?.[0];
    if (!nextAvatar) {
      setAvatar(null);
      return;
    }

    if (!AVATAR_ALLOWED_TYPES.includes(nextAvatar.type)) {
      toast.error(t('auth.account.avatarInvalidType'));
      event.target.value = '';
      return;
    }

    if (nextAvatar.size > AVATAR_MAX_BYTES) {
      toast.error(t('auth.account.avatarTooLarge'));
      event.target.value = '';
      return;
    }

    setAvatar(nextAvatar);
  };

  const onRemoveAvatar = async () => {
    setRemoveAvatarPending(true);

    try {
      await updateProfile({
        name: name.trim().length >= 2 ? name.trim() : user.name,
        removeAvatar: true
      });
      toast.success(t('auth.toast.profileUpdated'));
      setAvatar(null);
      setAvatarPreviewUrl(null);
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setRemoveAvatarPending(false);
    }
  };

  const onProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!profileChanged) {
      return;
    }

    setProfilePending(true);

    try {
      await updateProfile({ name: name.trim(), avatar });
      toast.success(t('auth.toast.profileUpdated'));
      setAvatar(null);
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setProfilePending(false);
    }
  };

  const onPasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!passwordsMatch) {
      toast.error(t('auth.account.passwordMismatch'));
      return;
    }

    setPasswordPending(true);

    try {
      await changePassword({ currentPassword, newPassword });
      toast.success(t('auth.toast.passwordUpdated'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setPasswordPending(false);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">{t('auth.account.editTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('auth.account.editSubtitle')}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/account">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('auth.account.title')}
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t('auth.account.profileCard')}</CardTitle>
            <CardDescription>{t('auth.account.nameHelp')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={onProfileSubmit}>
              <div className="flex items-center gap-4">
                {displayAvatarUrl ? (
                  <img
                    src={displayAvatarUrl}
                    alt={`${user.name} avatar`}
                    className="h-20 w-20 rounded-full object-cover ring-1 ring-border"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 text-lg font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
                    {getInitials(user.name, user.email)}
                  </div>
                )}
                <div className="space-y-2">
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                  <Badge variant={user.isEmailVerified ? 'default' : 'secondary'}>
                    {user.isEmailVerified ? t('auth.account.verified') : t('auth.account.unverified')}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="account-name">{t('auth.common.name')}</Label>
                <Input
                  id="account-name"
                  required
                  minLength={2}
                  maxLength={80}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-avatar">{t('auth.common.avatar')}</Label>
                <Input
                  id="account-avatar"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={onAvatarChange}
                />
                <p className="text-sm text-muted-foreground">{t('auth.account.avatarHelp')}</p>
                <p className="text-sm text-muted-foreground">{t('auth.account.avatarConstraints')}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button disabled={profilePending || name.trim().length < 2 || !profileChanged} type="submit">
                  <Upload className="mr-2 h-4 w-4" />
                  {profilePending ? t('auth.account.profilePending') : t('auth.account.saveProfile')}
                </Button>
                {displayAvatarUrl ? (
                  <Button
                    disabled={removeAvatarPending}
                    onClick={onRemoveAvatar}
                    type="button"
                    variant="outline"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {removeAvatarPending ? t('auth.account.avatarRemovePending') : t('auth.account.avatarRemove')}
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('auth.account.securityCard')}</CardTitle>
            <CardDescription>{t('auth.account.passwordHelp')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onPasswordSubmit}>
              <div className="space-y-2">
                <Label htmlFor="current-password">{t('auth.common.currentPassword')}</Label>
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">{t('auth.common.newPassword')}</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">{t('auth.common.confirmPassword')}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
              <div className="rounded-md border bg-slate-50/80 p-3 text-sm dark:bg-slate-900/60">
                <p className="mb-2 font-medium">{t('auth.account.passwordChecklist')}</p>
                <ul className="space-y-1 text-muted-foreground">
                  {passwordRules.map((rule) => (
                    <li key={rule.id} className="flex items-center gap-2">
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${
                          rule.valid ? 'bg-emerald-600' : 'bg-slate-400 dark:bg-slate-500'
                        }`}
                      />
                      <span>{rule.label}</span>
                    </li>
                  ))}
                </ul>
                {confirmPassword.length > 0 ? (
                  <p className={`mt-3 font-medium ${passwordsMatch ? 'text-emerald-600' : 'text-red-500'}`}>
                    {passwordsMatch ? t('auth.account.passwordsMatch') : t('auth.account.passwordsUnmatch')}
                  </p>
                ) : null}
              </div>
              <Button
                disabled={passwordPending || !currentPassword || !newPassword || !confirmPassword || !passwordsMatch || !isPasswordStrong}
                type="submit"
              >
                <KeyRound className="mr-2 h-4 w-4" />
                {passwordPending ? t('auth.account.passwordPending') : t('auth.account.savePassword')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountEditForm;
