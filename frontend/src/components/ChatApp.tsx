import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { fetchConfig, sendChat } from '../api';
import type { AgentReply, ChatItem, SiteConfig } from '../types';
import StreamingText from './StreamingText';
import ConfirmCard from './widgets/ConfirmCard';
import DateTimeWidget from './widgets/DateTimeWidget';
import EmailWidget from './widgets/EmailWidget';
import SuccessCard from './widgets/SuccessCard';

const DEFAULT_CONFIG: SiteConfig = {
  title: "Hi, I'm Vsevolod",
  subtitle: 'Senior AI Engineer at OTP Group',
  avatar: null,
  greeting:
    'This is my AI agent — it can tell you about me\nand book a meeting with me.',
  buttons: [
    { label: 'About Vsevolod', kind: 'about', url: '' },
    { label: 'GitHub ↗', kind: 'link', url: 'https://github.com/vsezol' },
    { label: 'LinkedIn ↗', kind: 'link', url: 'https://www.linkedin.com/in/vsezol' },
    { label: 'Telegram ↗', kind: 'link', url: 'https://t.me/vsezol' },
  ],
  schedule: [],
  slot_minutes: 30,
  tz_label: '',
};

const PLACEHOLDERS = [
  'Tell me about Vsevolod',
  "Let's meet tomorrow at 4 pm",
  'Book a call on Friday at 11:00',
  'I want to talk to Seva — my email is you@example.com',
  'What does Vsevolod work on?',
];

const PHRASES: Record<'en' | 'ru', string[]> = {
  en: [
    'Asking Vsevolod',
    'Talking to Vsevolod',
    'Checking his calendar',
    'Pinging Vsevolod',
    'Reading his schedule',
    'Waking Vsevolod up',
    'Negotiating a slot',
  ],
  ru: [
    'Спрашиваю Всеволода',
    'Связываюсь с Всеволодом',
    'Смотрю его календарь',
    'Обсуждаю с Всеволодом',
    'Сверяю расписание',
    'Бужу Всеволода',
    'Согласовываю слот',
  ],
};

let nextId = 0;
const uid = () => `item-${nextId++}`;

export default function ChatApp() {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
  const [items, setItems] = useState<ChatItem[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [started, setStarted] = useState(false);
  const [focus, setFocus] = useState(false);
  const [lang, setLang] = useState<'en' | 'ru'>('en');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const historyRef = useRef<unknown | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef<{ afterId: string; item: ChatItem } | null>(null);

  useEffect(() => {
    fetchConfig()
      .then(setConfig)
      .catch(() => undefined);
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
    if (/[а-яё]/i.test(text)) setLang('ru');
    else if (/[a-z]/i.test(text)) setLang('en');
    if (bubble) {
      append({ kind: 'text', id: uid(), role: 'user', text: bubble });
    }
    setBusy(true);
    try {
      const { reply, history } = await sendChat(text, historyRef.current);
      historyRef.current = history;
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
      append({
        kind: 'error',
        id: uid(),
        text:
          lang === 'ru'
            ? 'Что-то пошло не так. Попробуйте ещё раз.'
            : 'Something went wrong. Please try again.',
      });
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
                onApprove={(email) => {
                  resolveWidget(item.id, email);
                  void send(`[widget] I confirm my email: ${email}`, null);
                }}
                onDecline={() => {
                  resolveWidget(item.id, lang === 'ru' ? 'Отклонено' : 'Declined');
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
                slotMinutes={config.slot_minutes}
                schedule={config.schedule}
                onApprove={(startIso) => {
                  resolveWidget(
                    item.id,
                    dayjs(startIso).format('ddd, MMM D · HH:mm'),
                  );
                  void send(
                    `[widget] I confirm the meeting time: ${startIso}`,
                    null,
                  );
                }}
                onDecline={() => {
                  resolveWidget(item.id, lang === 'ru' ? 'Отклонено' : 'Declined');
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
                tzLabel={config.tz_label}
                disabled={busy}
                onBook={() => {
                  resolveWidget(
                    item.id,
                    lang === 'ru' ? 'Забронировано' : 'Booked',
                  );
                  void send('[widget] Confirmed — book the meeting.', null);
                }}
                onDecline={() => {
                  resolveWidget(item.id, lang === 'ru' ? 'Отклонено' : 'Declined');
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

  const avatarUrl = config.avatar ?? '/my-avatar.webp';
  const canSend = Boolean(draft.trim()) && !busy;

  const chips = config.buttons.map((b, i) =>
    b.kind === 'link' ? (
      <a key={i} className="chip" href={b.url} target="_blank" rel="noreferrer">
        {b.label}
      </a>
    ) : (
      <button
        key={i}
        type="button"
        className="chip"
        onClick={() => void send(b.label)}
      >
        {b.label}
      </button>
    ),
  );

  return (
    <div className="app">
      <div className="scroll" ref={chatRef}>
        {!started ? (
          <div className="hero">
            <div className="hero-avatar-wrap">
              <div className="hero-avatar-glow" />
              <div
                className="avatar-lg"
                style={{ backgroundImage: `url("${avatarUrl}")` }}
              />
            </div>
            <h1 className="hero-title">{config.title}</h1>
            <div className="hero-sub">{config.subtitle}</div>
            <p className="hero-intro">{config.greeting}</p>
          </div>
        ) : (
          <div className="thread">
            <div className="thread-intro">
              <div
                className="thread-avatar"
                style={{ backgroundImage: `url("${avatarUrl}")` }}
              />
              <div className="thread-intro-info">
                <div className="thread-intro-title">{config.title}</div>
                <div className="thread-intro-sub">{config.subtitle}</div>
              </div>
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
                ? 'Message the agent…'
                : PLACEHOLDERS[placeholderIdx % PLACEHOLDERS.length]
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
  const phrases = PHRASES[lang];
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
