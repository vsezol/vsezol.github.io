import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchConfig, fetchSession, sendChat } from '../api';
import i18n from '../i18n';
import { LOCALE, fmtDay, pickText } from '../locale';
import type {
  AgentReply,
  ChatItem,
  SiteConfig,
  TranscriptEntry,
} from '../types';
import StreamingText from './StreamingText';
import ConfirmCard from './widgets/ConfirmCard';
import DateTimeWidget from './widgets/DateTimeWidget';
import EmailWidget from './widgets/EmailWidget';
import SuccessCard from './widgets/SuccessCard';

// shown only if the config request fails repeatedly — normally the UI
// keeps a skeleton until the admin-managed texts arrive
const FALLBACK_CONFIG: SiteConfig = {
  title: "Hi, I'm Vsevolod",
  subtitle: 'Senior AI Engineer at OTP Group',
  title_ru: 'Привет, я Всеволод',
  subtitle_ru: 'Senior AI Engineer в OTP Group',
  avatar: null,
  greeting:
    'This is my AI agent — it can tell you about me\nand book a meeting with me.',
  greeting_ru:
    'Это мой AI-агент — он может рассказать обо мне\nи записать вас на встречу со мной.',
  buttons: [
    { label: 'About Vsevolod', label_ru: 'О Всеволоде', kind: 'about', url: '' },
    { label: 'GitHub ↗', kind: 'link', url: 'https://github.com/vsezol' },
    { label: 'LinkedIn ↗', kind: 'link', url: 'https://www.linkedin.com/in/vsezol' },
    { label: 'Telegram ↗', kind: 'link', url: 'https://t.me/vsezol' },
  ],
  schedule: [],
  slot_minutes: 30,
  tz_label: '',
};

const CONFIG_FETCH_ATTEMPTS = 3;

const SESSION_KEY = 'agent-session-id';

// localStorage can throw (private mode / storage disabled)
function readSessionId(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function writeSessionId(id: string): void {
  try {
    localStorage.setItem(SESSION_KEY, id);
  } catch {
    /* not persisted — the conversation still works within this tab */
  }
}

function clearSessionId(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

let nextId = 0;
const uid = () => `item-${nextId++}`;

export default function ChatApp() {
  const { t } = useTranslation();
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [items, setItems] = useState<ChatItem[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [started, setStarted] = useState(false);
  const [focus, setFocus] = useState(false);
  const [lang, setLang] = useState<'en' | 'ru'>(LOCALE);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const historyRef = useRef<unknown | null>(null);
  const sessionRef = useRef<string | null>(readSessionId());
  const chatRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef<{ afterId: string; item: ChatItem } | null>(null);

  // conversation-language translator (may differ from the UI locale)
  const tl = i18n.getFixedT(lang);

  // restore a previous conversation from the server-side session
  useEffect(() => {
    const id = sessionRef.current;
    if (!id) return;
    let alive = true;
    fetchSession(id)
      .then(({ transcript }) => {
        if (!alive || !transcript.length) return;
        setItems(transcript.flatMap(entryToItems));
        setStarted(true);
      })
      .catch(() => {
        // expired or unknown — start fresh
        sessionRef.current = null;
        clearSessionId();
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function entryToItems(entry: TranscriptEntry): ChatItem[] {
    if (entry.kind === 'user') {
      return [{ kind: 'text', id: uid(), role: 'user', text: entry.text }];
    }
    const out: ChatItem[] = [
      {
        kind: 'text',
        id: uid(),
        role: 'agent',
        text: entry.reply.message,
        fresh: false,
      },
    ];
    const widget = widgetFor(entry.reply);
    if (widget) {
      if ('resolved' in widget && entry.resolved) {
        widget.resolved = restoredSummary(entry.reply.type, entry.resolved);
      }
      out.push(widget);
    }
    return out;
  }

  function restoredSummary(replyType: AgentReply['type'], resolved: string): string {
    if (resolved === 'declined') return tl('summary.declined');
    if (resolved === 'booked') return tl('summary.booked');
    if (replyType === 'ask_datetime') {
      const d = dayjs(resolved);
      return `${fmtDay(d, lang)} · ${d.format('HH:mm')}`;
    }
    return resolved; // the confirmed email
  }

  useEffect(() => {
    let alive = true;
    void (async () => {
      for (let attempt = 1; attempt <= CONFIG_FETCH_ATTEMPTS; attempt++) {
        try {
          const cfg = await fetchConfig();
          if (alive) setConfig(cfg);
          return;
        } catch {
          await new Promise((r) => setTimeout(r, 800 * attempt));
        }
      }
      if (alive) setConfig(FALLBACK_CONFIG);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (started) return;
    const t = window.setInterval(
      () => setPlaceholderIdx((i) => i + 1),
      3200,
    );
    return () => window.clearInterval(t);
  }, [started]);

  function scrollToBottom() {
    const el = chatRef.current;
    if (el) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }

  useEffect(scrollToBottom, [items, busy]);

  const append = (...newItems: ChatItem[]) =>
    setItems((prev) => [...prev, ...newItems]);

  const resolveWidget = (id: string, summary: string) =>
    setItems((prev) =>
      prev.map((item) =>
        item.id === id &&
        (item.kind === 'email_widget' ||
          item.kind === 'datetime_widget' ||
          item.kind === 'confirm_widget')
          ? { ...item, resolved: summary }
          : item,
      ),
    );

  function finishStream(id: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id && item.kind === 'text' ? { ...item, fresh: false } : item,
      ),
    );
    const pending = pendingRef.current;
    if (pending && pending.afterId === id) {
      pendingRef.current = null;
      append(pending.item);
    }
  }

  async function send(message: string, bubble: string | null = message) {
    if (busy) return;
    const text = message.trim();
    if (!text) return;
    setStarted(true);
    // widget events are internal English strings — not a language signal
    if (!text.startsWith('[widget]')) {
      if (/[а-яё]/i.test(text)) setLang('ru');
      else if (/[a-z]/i.test(text)) setLang('en');
    }
    if (bubble) {
      append({ kind: 'text', id: uid(), role: 'user', text: bubble });
    }
    setBusy(true);
    try {
      const { reply, history, session_id } = await sendChat(
        text,
        historyRef.current,
        LOCALE,
        sessionRef.current,
      );
      historyRef.current = history;
      if (session_id && session_id !== sessionRef.current) {
        sessionRef.current = session_id;
        writeSessionId(session_id);
      }
      const textItem: ChatItem = {
        kind: 'text',
        id: uid(),
        role: 'agent',
        text: reply.message,
        fresh: true,
      };
      const widget = widgetFor(reply);
      if (widget) {
        pendingRef.current = { afterId: textItem.id, item: widget };
      }
      append(textItem);
    } catch {
      append({ kind: 'error', id: uid(), text: tl('chat.error') });
    } finally {
      setBusy(false);
    }
  }

  function widgetFor(reply: AgentReply): ChatItem | null {
    switch (reply.type) {
      case 'ask_email':
        return {
          kind: 'email_widget',
          id: uid(),
          prefill: reply.prefill,
          resolved: null,
        };
      case 'ask_datetime':
        return {
          kind: 'datetime_widget',
          id: uid(),
          prefillStart: reply.prefill_start,
          durationMinutes: reply.duration_minutes,
          resolved: null,
        };
      case 'ask_confirm':
        return {
          kind: 'confirm_widget',
          id: uid(),
          start: reply.start,
          durationMinutes: reply.duration_minutes,
          email: reply.email,
          resolved: null,
        };
      case 'booked':
        return {
          kind: 'success',
          id: uid(),
          meetUrl: reply.meet_url,
          start: reply.start,
          end: reply.end,
          email: reply.email,
        };
      default:
        return null;
    }
  }

  function renderItem(item: ChatItem) {
    switch (item.kind) {
      case 'text':
        if (item.role === 'user') {
          return (
            <div className="msg" key={item.id}>
              <div className="bubble-user">{item.text}</div>
            </div>
          );
        }
        return (
          <div className="msg" key={item.id}>
            <StreamingText
              text={item.text}
              instant={!item.fresh}
              onProgress={scrollToBottom}
              onDone={() => finishStream(item.id)}
            />
          </div>
        );
      case 'error':
        return (
          <div className="msg" key={item.id}>
            <div className="agent-text">⚠️ {item.text}</div>
          </div>
        );
      case 'email_widget':
        return (
          <div className="msg" key={item.id}>
            {item.resolved ? (
              <Summary text={item.resolved} />
            ) : (
              <EmailWidget
                prefill={item.prefill}
                disabled={busy}
                lang={lang}
                onApprove={(email) => {
                  resolveWidget(item.id, email);
                  void send(`[widget] I confirm my email: ${email}`, null);
                }}
                onDecline={() => {
                  resolveWidget(item.id, tl('summary.declined'));
                  void send("[widget] I don't want to share this email.", null);
                }}
              />
            )}
          </div>
        );
      case 'datetime_widget':
        return (
          <div className="msg" key={item.id}>
            {item.resolved ? (
              <Summary text={item.resolved} />
            ) : (
              <DateTimeWidget
                prefillStart={item.prefillStart}
                disabled={busy}
                lang={lang}
                slotMinutes={cfg.slot_minutes}
                schedule={cfg.schedule}
                onApprove={(startIso) => {
                  resolveWidget(
                    item.id,
                    `${fmtDay(dayjs(startIso), lang)} · ${dayjs(startIso).format('HH:mm')}`,
                  );
                  void send(
                    `[widget] I confirm the meeting time: ${startIso}`,
                    null,
                  );
                }}
                onDecline={() => {
                  resolveWidget(item.id, tl('summary.declined'));
                  void send("[widget] That time doesn't work for me.", null);
                }}
              />
            )}
          </div>
        );
      case 'confirm_widget':
        return (
          <div className="msg" key={item.id}>
            {item.resolved ? (
              <Summary text={item.resolved} />
            ) : (
              <ConfirmCard
                start={item.start}
                durationMinutes={item.durationMinutes}
                email={item.email}
                tzLabel={cfg.tz_label}
                disabled={busy}
                lang={lang}
                onBook={() => {
                  resolveWidget(
                    item.id,
                    tl('summary.booked'),
                  );
                  void send('[widget] Confirmed — book the meeting.', null);
                }}
                onDecline={() => {
                  resolveWidget(item.id, tl('summary.declined'));
                  void send(
                    '[widget] I declined the booking confirmation.',
                    null,
                  );
                }}
              />
            )}
          </div>
        );
      case 'success':
        return (
          <div className="msg" key={item.id}>
            <SuccessCard
              meetUrl={item.meetUrl}
              start={item.start}
              email={item.email}
              lang={lang}
            />
          </div>
        );
    }
  }

  function submit() {
    const text = draft.trim();
    if (!text || busy) return;
    setDraft('');
    void send(text);
  }

  const cfg = config ?? FALLBACK_CONFIG;
  const avatarUrl = cfg.avatar ?? '/my-avatar.webp';
  const canSend = Boolean(draft.trim()) && !busy;

  const title = pickText(cfg.title, cfg.title_ru);
  const subtitle = pickText(cfg.subtitle, cfg.subtitle_ru);
  const greeting = pickText(cfg.greeting, cfg.greeting_ru);

  // skeleton pills until the admin config arrives
  const chips = config
    ? config.buttons.map((b, i) => {
        const label = pickText(b.label, b.label_ru);
        return b.kind === 'link' ? (
          <a key={i} className="chip" href={b.url} target="_blank" rel="noreferrer">
            {label}
          </a>
        ) : (
          <button
            key={i}
            type="button"
            className="chip"
            onClick={() => void send(label)}
          >
            {label}
          </button>
        );
      })
    : Array.from({ length: 4 }, (_, i) => (
        <span key={i} className="skel skel-chip" />
      ));

  const placeholders = t('chat.placeholders', { returnObjects: true }) as string[];

  return (
    <div className="app">
      <div className="scroll" ref={chatRef}>
        {!started ? (
          config ? (
            <div className="hero">
              <div className="hero-avatar-wrap">
                <div className="hero-avatar-glow" />
                <div
                  className="avatar-lg"
                  style={{ backgroundImage: `url("${avatarUrl}")` }}
                />
              </div>
              <h1 className="hero-title">{title}</h1>
              <div className="hero-sub">{subtitle}</div>
              <p className="hero-intro">{greeting}</p>
            </div>
          ) : (
            <div className="hero hero-loading">
              <div className="skel skel-avatar" />
              <div className="skel skel-title" />
              <div className="skel skel-sub" />
              <div className="skel skel-line" />
              <div className="skel skel-line short" />
            </div>
          )
        ) : (
          <div className="thread">
            <div className="thread-intro">
              <div
                className="thread-avatar"
                style={{ backgroundImage: `url("${avatarUrl}")` }}
              />
              {config ? (
                <div className="thread-intro-info">
                  <div className="thread-intro-title">{title}</div>
                  <div className="thread-intro-sub">{subtitle}</div>
                </div>
              ) : (
                <div className="thread-intro-info">
                  <span className="skel skel-title-sm" />
                  <span className="skel skel-sub-sm" />
                </div>
              )}
            </div>
            {items.map(renderItem)}
            {busy && <TypingIndicator lang={lang} />}
          </div>
        )}
      </div>

      <div className="composer-zone">
        <div className="chips-row">{chips}</div>
        <div className={`composer${focus ? ' focus' : ''}`}>
          <input
            className="composer-input"
            value={draft}
            placeholder={
              started
                ? t('chat.inputPlaceholder')
                : placeholders[placeholderIdx % placeholders.length]
            }
            onChange={(e) => setDraft(e.target.value)}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
          />
          <div className="composer-bottom">
            <button
              type="button"
              className={`send-btn${canSend ? ' ready' : ''}`}
              onClick={submit}
              aria-label="Send"
            >
              <svg width="17" height="17" viewBox="0 0 16 16" fill="none" style={{ display: 'block' }}>
                <path
                  d="M8 13V3M8 3L3.5 7.5M8 3l4.5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className={`spacer${started ? ' chatting' : ''}`} />
    </div>
  );
}

function TypingIndicator({ lang }: { lang: 'en' | 'ru' }) {
  const phrases = i18n.getFixedT(lang)('chat.typing', {
    returnObjects: true,
  }) as string[];
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * phrases.length));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const rotate = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setIdx((i) => (i + 1) % phrases.length);
        setVisible(true);
      }, 260);
    }, 1600);
    return () => window.clearInterval(rotate);
  }, [phrases.length]);

  return (
    <div className="msg">
      <div className="typing-row">
        <span className="thinking-phrase" style={{ opacity: visible ? 1 : 0 }}>
          {phrases[idx]}
        </span>
        <span className="typing-dots">
          <span />
          <span />
          <span />
        </span>
      </div>
    </div>
  );
}

function Summary({ text }: { text: string }) {
  return (
    <div className="summary-chip">
      <span className="check">✓</span>
      {text}
    </div>
  );
}
