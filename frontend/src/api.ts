import type { ChatResponse, SiteConfig } from './types';

const API_URL: string = import.meta.env.VITE_API_URL ?? '';

export async function sendChat(
  message: string,
  history: unknown | null,
): Promise<ChatResponse> {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      history,
      client_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
  });
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }
  return res.json();
}

export async function fetchConfig(): Promise<SiteConfig> {
  const res = await fetch(`${API_URL}/api/config`);
  if (!res.ok) {
    throw new Error(`Config request failed with status ${res.status}`);
  }
  return res.json();
}
