import type { ChatResponse, SiteConfig } from './types';

const API_URL: string = import.meta.env.VITE_API_URL ?? '';

// statuses where the server definitely did not book anything — safe to retry
const RETRYABLE = new Set([429, 502, 503]);

export async function sendChat(
  message: string,
  history: unknown | null,
  locale: string,
): Promise<ChatResponse> {
  const post = () =>
    fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history,
        client_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        client_locale: locale,
      }),
    });

  let res = await post();
  if (RETRYABLE.has(res.status)) {
    await new Promise((r) => setTimeout(r, 1500));
    res = await post();
  }
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
