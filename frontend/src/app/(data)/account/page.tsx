import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/_actions/auth';
import AccountOverview from '@/components/account/account-overview';

const AccountPage = async () => {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return <AccountOverview user={user} />;
};

export default AccountPage;
