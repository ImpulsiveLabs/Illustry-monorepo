import { CliContext } from '../context';

const getStatus = async (context: CliContext) => {
  const profile = await context.profile();
  const store = await context.store();
  const assets = await store.readAssets();
  return {
    profile: profile.name,
    mode: profile.mode,
    workspace: store.rootDir,
    server: profile.serverUrl,
    authenticated: Boolean(profile.session?.cookie),
    user: profile.session?.user || null,
    assets: assets.length
  };
};

type CliStatus = Awaited<ReturnType<typeof getStatus>>;

export {
  getStatus
};
export type {
  CliStatus
};
