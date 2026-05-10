import ShareInviteClient from './share-invite-client';

type ShareInvitePageProps = {
  searchParams: Promise<{ token?: string }>;
};

const ShareInvitePage = async ({ searchParams }: ShareInvitePageProps) => {
  const { token = '' } = await searchParams;
  return <ShareInviteClient token={token} />;
};

export default ShareInvitePage;
