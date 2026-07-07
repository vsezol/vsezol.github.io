// Cloudflare Turnstile token provider — proves the request came from a real
// browser. Entirely inert until VITE_TURNSTILE_SITE_KEY is set, so shipping
// it has zero effect on visitors until Cloudflare is wired up.

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
const SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

interface Turnstile {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  execute: (id: string) => void;
  reset: (id: string) => void;
}
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

let scriptPromise: Promise<void> | null = null;
let widgetId: string | null = null;
let pending: ((token: string | null) => void) | null = null;

function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT_URL;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Turnstile failed to load'));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

async function ensureWidget(): Promise<void> {
  await loadScript();
  if (widgetId != null || !window.turnstile) return;
  // Renderable container (NOT display:none) so that, on the rare occasion
  // Cloudflare needs interaction, the challenge can actually show instead of
  // silently failing and locking the visitor out. `interaction-only` keeps it
  // invisible whenever no interaction is required (the common case).
  const holder = document.createElement('div');
  holder.style.position = 'fixed';
  holder.style.bottom = '16px';
  holder.style.left = '50%';
  holder.style.transform = 'translateX(-50%)';
  holder.style.zIndex = '2147483647';
  document.body.appendChild(holder);
  widgetId = window.turnstile.render(holder, {
    sitekey: SITE_KEY,
    execution: 'execute', // token minted on demand via execute()
    appearance: 'interaction-only', // only visible if a challenge is required
    callback: (token: string) => {
      pending?.(token);
      pending = null;
    },
    'error-callback': () => {
      pending?.(null);
      pending = null;
    },
  });
}

/** A fresh single-use token, or null if Turnstile isn't configured/available. */
export async function getTurnstileToken(): Promise<string | null> {
  if (!SITE_KEY) return null;
  try {
    await ensureWidget();
    if (!window.turnstile || widgetId == null) return null;
    return await new Promise<string | null>((resolve) => {
      pending = resolve;
      window.turnstile!.reset(widgetId!);
      window.turnstile!.execute(widgetId!);
      // don't hang the send if the challenge never resolves
      window.setTimeout(() => {
        if (pending === resolve) {
          pending = null;
          resolve(null);
        }
      }, 8000);
    });
  } catch {
    return null;
  }
}
