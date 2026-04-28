import { redirect } from 'next/navigation';
import AccountEditForm from '@/components/account/account-edit-form';
import { getCurrentUser } from '@/app/_actions/auth';

const AccountEditPage = async () => {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return <AccountEditForm user={user} />;
};

export default AccountEditPage;
