import { IllustryError } from '@illustry/core';
import { CliContext } from '../context';

type AuthCredentials = {
  email?: string;
  password?: string;
  name?: string;
};

const requireValue = (value: string | undefined, label: string) => {
  if (!value) {
    throw new IllustryError(`Missing ${label}.`, {
      code: 'ILLUSTRY_CLI_MISSING_AUTH_FIELD',
      status: 400
    });
  }
  return value;
};

const login = async (context: CliContext, credentials: AuthCredentials) => {
  const client = await context.client();
  const result = await client.login({
    email: requireValue(credentials.email, '--email'),
    password: requireValue(credentials.password, '--password')
  });
  await context.saveClientSession(client.getSessionSnapshot());
  await context.config.setMode('live');
  return result;
};

const signup = async (context: CliContext, credentials: AuthCredentials) => {
  const client = await context.client();
  const result = await client.signup({
    email: requireValue(credentials.email, '--email'),
    password: requireValue(credentials.password, '--password'),
    name: requireValue(credentials.name, '--name')
  });
  await context.saveClientSession(client.getSessionSnapshot());
  await context.config.setMode('live');
  return result;
};

const logout = async (context: CliContext) => {
  const profile = await context.profile();
  if (!profile.serverUrl || !profile.session?.cookie) {
    await context.config.clearSession();
    return { ok: true, message: 'No live session was active.' };
  }
  const client = await context.client();
  const result = await client.logout();
  await context.config.clearSession();
  return result;
};

const session = async (context: CliContext) => {
  const profile = await context.profile();
  if (profile.mode !== 'live' || !profile.serverUrl || !profile.session?.cookie) {
    return {
      mode: profile.mode,
      server: profile.serverUrl,
      authenticated: false,
      user: profile.session?.user || null
    };
  }
  const client = await context.client();
  const user = await client.me();
  await context.saveClientSession(client.getSessionSnapshot());
  return {
    mode: 'live',
    server: profile.serverUrl,
    authenticated: true,
    user
  };
};

const verifyEmail = async (context: CliContext, token?: string, email?: string, code?: string) => {
  const client = await context.client();
  const result = token
    ? await client.verifyEmail(token)
    : await client.verifyEmailCode(requireValue(email, '--email'), requireValue(code, '--code'));
  await context.saveClientSession(client.getSessionSnapshot());
  return result;
};

const resendVerification = async (context: CliContext, email?: string) => {
  const client = await context.client();
  const result = await client.resendVerification(email);
  await context.saveClientSession(client.getSessionSnapshot());
  return result;
};

const forgotPassword = async (context: CliContext, email?: string) => {
  const client = await context.client();
  return client.requestPasswordReset(requireValue(email, '--email'));
};

const resetPassword = async (context: CliContext, token?: string, password?: string) => {
  const client = await context.client();
  const result = await client.resetPassword(
    requireValue(token, '--token'),
    requireValue(password, '--password')
  );
  await context.config.clearSession();
  return result;
};

export {
  forgotPassword,
  login,
  logout,
  resendVerification,
  resetPassword,
  session,
  signup,
  verifyEmail
};
export type {
  AuthCredentials
};
