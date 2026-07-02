import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { sendChat } from '../api';
import { LINKS } from '../links';
import type { AgentReply, ChatItem } from '../types';
import ConfirmCard from './widgets/ConfirmCard';
import DateTimeWidget from './widgets/DateTimeWidget';
import EmailWidget from './widgets/EmailWidget';
import SuccessCard from './widgets/SuccessCard';

let nextId = 0;
const uid = () => `item-${nextId++}`;

export default function ChatApp() {
  const [items, setItems] = useState<ChatItem[]>([
    { kind: 'intro', id: uid() },
    { kind: 'chips', id: uid() },
  ]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const historyRef = useRef<unknown | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = chatRef.current;
    if (el) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }, [items, busy]);

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

  async function send(message: string, bubble: string | null = message) {
    if (busy) return;
    const text = message.trim();
    if (!text) return;
    if (bubble) {
      append({ kind: 'text', id: uid(), role: 'user', text: bubble });
    }
    setBusy(true);
    try {
      const { reply, history } = await sendChat(text, historyRef.current);
      historyRef.current = history;
      append(...replyToItems(reply));
    } catch {
      append({
        kind: 'error',
        id: uid(),
        text: 'Something went wrong. Please try again.',
      });
    } finally {
      setBusy(false);
    }
  }

  function replyToItems(reply: AgentReply): ChatItem[] {
    const message: ChatItem = {
      kind: 'text',
      id: uid(),
      role: 'agent',
      text: reply.message,
    };
    switch (reply.type) {
      case 'text':
        return [message];
      case 'ask_email':
        return [
          message,
          { kind: 'email_widget', id: uid(), prefill: reply.prefill, resolved: null },
        ];
      case 'ask_datetime':
        return [
          message,
          {
            kind: 'datetime_widget',
            id: uid(),
            prefillStart: reply.prefill_start,
            durationMinutes: reply.duration_minutes,
            resolved: null,
          },
        ];
      case 'ask_confirm':
        return [
          message,
          {
            kind: 'confirm_widget',
            id: uid(),
            start: reply.start,
            durationMinutes: reply.duration_minutes,
            email: reply.email,
            resolved: null,
          },
        ];
      case 'booked':
        return [
          message,
          {
            kind: 'success',
            id: uid(),
            meetUrl: reply.meet_url,
            start: reply.start,
            end: reply.end,
            email: reply.email,
          },
        ];
    }
  }

  function renderItem(item: ChatItem) {
    switch (item.kind) {
      case 'intro':
        return (
          <div className="msg" key={item.id}>
            <div className="bubble-agent">
              I'm the personal AI agent of{' '}
              <span className="hl">Vsevolod Zolotov</span> — Senior AI Engineer
              building LLM-powered products. Want to book a meeting? Tell me
              when works for you, e.g.{' '}
              <span className="dim">
                "tomorrow at 15:00, my email is you@example.com"
              </span>
            </div>
          </div>
        );
      case 'chips':
        return (
          <div className="msg" key={item.id}>
            <div className="chips">
              <button
                type="button"
                className="chip"
                onClick={() => void send('Who is Vsevolod?', 'About Vsevolod')}
              >
                About Vsevolod
              </button>
              <a className="chip" href={LINKS.github} target="_blank" rel="noreferrer">
                GitHub ↗
              </a>
              <a className="chip" href={LINKS.linkedin} target="_blank" rel="noreferrer">
                LinkedIn ↗
              </a>
              <a className="chip" href={LINKS.telegram} target="_blank" rel="noreferrer">
                Telegram ↗
              </a>
            </div>
          </div>
        );
      case 'text':
        return (
          <div className="msg" key={item.id}>
            <div className={item.role === 'user' ? 'bubble-user' : 'bubble-agent'}>
              {item.text}
            </div>
          </div>
        );
      case 'error':
        return (
          <div className="msg" key={item.id}>
            <div className="bubble-agent">⚠️ {item.text}</div>
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
                  resolveWidget(item.id, 'Declined');
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
                  resolveWidget(item.id, 'Declined');
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
                disabled={busy}
                onBook={() => {
                  resolveWidget(item.id, 'Booked');
                  void send('[widget] Confirmed — book the meeting.', null);
                }}
                onDecline={() => {
                  resolveWidget(item.id, 'Declined');
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

  return (
    <div className="app">
      <div className="shell">
        <div className="header">
          <div className="avatar-wrap">
            <img className="avatar" src="/my-avatar.webp" alt="Vsevolod" />
            <span className="online-dot" />
          </div>
          <div className="header-info">
            <div className="header-name">Vsevolod's AI Agent</div>
            <div className="header-sub">
              Senior AI Engineer · books meetings for you
            </div>
          </div>
        </div>

        <div className="chat" ref={chatRef}>
          {items.map(renderItem)}
          {busy && (
            <div className="msg">
              <div className="typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
        </div>

        <div className="composer">
          <div className="composer-row">
            <input
              className="composer-input"
              value={draft}
              placeholder="Message the agent…"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
            />
            <button
              type="button"
              className="send-btn"
              onClick={submit}
              disabled={busy}
              aria-label="Send"
            >
              ↑
            </button>
          </div>
          <div className="footnote">
            AI agent · books real meetings in Google Calendar
          </div>
        </div>
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
