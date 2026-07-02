import {
  Avatar,
  ChatContainer,
  ConversationHeader,
  MainContainer,
  Message,
  MessageInput,
  MessageList,
  TypingIndicator,
} from '@chatscope/chat-ui-kit-react';
import dayjs from 'dayjs';
import { useRef, useState } from 'react';
import { sendChat } from '../api';
import type { AgentReply, ChatItem } from '../types';
import BookingCard from './widgets/BookingCard';
import DateTimeWidget from './widgets/DateTimeWidget';
import EmailWidget from './widgets/EmailWidget';

const GREETING =
  "Hi! 👋 I'm the personal AI agent of Vsevolod Zolotov — he's a Senior AI Engineer. " +
  'Would you like to book a meeting with him? Just tell me when works for you ' +
  'and your email, and I\'ll set everything up. For example: "I want to meet ' +
  'with Vsevolod tomorrow at 15:00, my email is you@example.com".';

let nextId = 0;
const uid = () => `item-${nextId++}`;

export default function ChatApp() {
  const [items, setItems] = useState<ChatItem[]>([
    { kind: 'text', id: uid(), role: 'agent', text: GREETING },
  ]);
  const [busy, setBusy] = useState(false);
  const historyRef = useRef<unknown | null>(null);

  const append = (...newItems: ChatItem[]) =>
    setItems((prev) => [...prev, ...newItems]);

  const resolveWidget = (id: string) =>
    setItems((prev) =>
      prev.map((item) =>
        item.id === id &&
        (item.kind === 'email_widget' || item.kind === 'datetime_widget')
          ? { ...item, resolved: true }
          : item,
      ),
    );

  async function send(message: string, display?: string) {
    if (busy) return;
    const text = message.trim();
    if (!text) return;
    append({ kind: 'text', id: uid(), role: 'user', text: display ?? text });
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
    switch (reply.type) {
      case 'text':
        return [{ kind: 'text', id: uid(), role: 'agent', text: reply.message }];
      case 'ask_email':
        return [
          {
            kind: 'email_widget',
            id: uid(),
            prompt: reply.message,
            prefill: reply.prefill,
            resolved: false,
          },
        ];
      case 'ask_datetime':
        return [
          {
            kind: 'datetime_widget',
            id: uid(),
            prompt: reply.message,
            prefillStart: reply.prefill_start,
            durationMinutes: reply.duration_minutes,
            resolved: false,
          },
        ];
      case 'booked':
        return [
          {
            kind: 'booking',
            id: uid(),
            message: reply.message,
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
      case 'text':
        return (
          <Message
            key={item.id}
            model={{
              message: item.text,
              direction: item.role === 'user' ? 'outgoing' : 'incoming',
              position: 'single',
            }}
          />
        );
      case 'error':
        return (
          <Message
            key={item.id}
            model={{
              message: `⚠️ ${item.text}`,
              direction: 'incoming',
              position: 'single',
            }}
          />
        );
      case 'email_widget':
        return (
          <Message
            key={item.id}
            model={{ direction: 'incoming', position: 'single', type: 'custom' }}
          >
            <Message.CustomContent>
              <EmailWidget
                prompt={item.prompt}
                prefill={item.prefill}
                disabled={item.resolved || busy}
                onApprove={(email) => {
                  resolveWidget(item.id);
                  void send(
                    `[widget] I confirm my email: ${email}`,
                    `✉️ ${email}`,
                  );
                }}
                onDecline={() => {
                  resolveWidget(item.id);
                  void send(
                    "[widget] I don't want to share this email.",
                    '✖️ Declined',
                  );
                }}
              />
            </Message.CustomContent>
          </Message>
        );
      case 'datetime_widget':
        return (
          <Message
            key={item.id}
            model={{ direction: 'incoming', position: 'single', type: 'custom' }}
          >
            <Message.CustomContent>
              <DateTimeWidget
                prompt={item.prompt}
                prefillStart={item.prefillStart}
                durationMinutes={item.durationMinutes}
                disabled={item.resolved || busy}
                onApprove={(startIso) => {
                  resolveWidget(item.id);
                  void send(
                    `[widget] I confirm the meeting time: ${startIso}`,
                    `📅 ${dayjs(startIso).format('ddd, MMM D · HH:mm')}`,
                  );
                }}
                onDecline={() => {
                  resolveWidget(item.id);
                  void send(
                    "[widget] That time doesn't work for me.",
                    '✖️ Declined',
                  );
                }}
              />
            </Message.CustomContent>
          </Message>
        );
      case 'booking':
        return (
          <Message
            key={item.id}
            model={{ direction: 'incoming', position: 'single', type: 'custom' }}
          >
            <Message.CustomContent>
              <BookingCard
                message={item.message}
                meetUrl={item.meetUrl}
                start={item.start}
                end={item.end}
                email={item.email}
              />
            </Message.CustomContent>
          </Message>
        );
    }
  }

  return (
    <div className="chat-shell">
      <MainContainer>
        <ChatContainer>
          <ConversationHeader>
            <Avatar src="/my-avatar.webp" name="Vsevolod Zolotov" />
            <ConversationHeader.Content
              userName="Vsevolod's AI Agent"
              info="Senior AI Engineer · books meetings for you"
            />
          </ConversationHeader>
          <MessageList
            typingIndicator={
              busy ? <TypingIndicator content="Agent is thinking" /> : undefined
            }
          >
            {items.map(renderItem)}
          </MessageList>
          <MessageInput
            placeholder="Type a message…"
            attachButton={false}
            disabled={busy}
            onSend={(_html, textContent) => void send(textContent)}
          />
        </ChatContainer>
      </MainContainer>
    </div>
  );
}
