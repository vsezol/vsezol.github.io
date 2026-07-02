export type AgentReply =
  | { type: 'text'; message: string }
  | { type: 'ask_email'; message: string; prefill: string | null }
  | {
      type: 'ask_datetime';
      message: string;
      prefill_start: string | null;
      duration_minutes: number;
    }
  | {
      type: 'booked';
      message: string;
      meet_url: string;
      start: string;
      end: string;
      email: string;
    };

export interface ChatResponse {
  reply: AgentReply;
  history: unknown;
}

export type ChatItem =
  | { kind: 'text'; id: string; role: 'user' | 'agent'; text: string }
  | {
      kind: 'email_widget';
      id: string;
      prompt: string;
      prefill: string | null;
      resolved: boolean;
    }
  | {
      kind: 'datetime_widget';
      id: string;
      prompt: string;
      prefillStart: string | null;
      durationMinutes: number;
      resolved: boolean;
    }
  | {
      kind: 'booking';
      id: string;
      message: string;
      meetUrl: string;
      start: string;
      end: string;
      email: string;
    }
  | { kind: 'error'; id: string; text: string };
