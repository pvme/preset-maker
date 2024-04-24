import { type Session } from '@auth/core/types';
import { isDevelopment } from '../utility/environment';

const developmentAuthHost = 'http://localhost:8080/api/auth';
const developmentCallbackUrl = 'http://localhost:3000/preset-maker/auth/discord/callback';

const productionAuthHost = 'https://pvme.io/api/auth';
const productionCallbackUrl = '';

function getHost (): string {
  return isDevelopment()
    ? developmentAuthHost
    : productionAuthHost;
}

export function signIn (): void {
  window.location.href = `${getHost()}/signin?callbackUrl=${isDevelopment()
    ? developmentCallbackUrl
    : productionCallbackUrl}`;
}

export function signOut (): void {
  window.location.href = `${getHost()}/signout`;
}

export async function getSession (): Promise<Session> {
  const url = getHost() + '/session';
  const existingSession = await fetch(url, {
    method: 'GET',
    credentials: 'include'
  });

  return await existingSession.json();
}
