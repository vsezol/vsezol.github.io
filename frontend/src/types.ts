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
      type: 'ask_confirm';
      message: string;
      start: string;
      duration_minutes: number;
      email: string;
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
  session_id?: string | null;
}

export type TranscriptEntry =
  | { kind: 'user'; text: string }
  | { kind: 'agent'; reply: AgentReply; resolved?: string | null };

export interface SessionResponse {
  session_id: string;
  transcript: TranscriptEntry[];
}

export interface ButtonCfg {
  label: string;
  /** Russian label; empty means "same as label" */
  label_ru?: string;
  kind: 'link' | 'about';
  url: string;
}

export interface DayCfg {
  on: boolean;
  start: string;
  end: string;
}

export interface SiteConfig {
  title: string;
  subtitle: string;
  title_ru?: string;
  subtitle_ru?: string;
  avatar: string | null;
  greeting: string;
  greeting_ru?: string;
  buttons: ButtonCfg[];
  schedule: DayCfg[];
  slot_minutes: number;
  tz_label: string;
}

export interface AdminConfig extends SiteConfig {
  bio: string;
}

export type ChatItem =
  | {
      kind: 'text';
      id: string;
      role: 'user' | 'agent';
      text: string;
      /** agent message still typing out */
      fresh?: boolean;
    }
  | {
      kind: 'email_widget';
      id: string;
      prefill: string | null;
      resolved: string | null;
    }
  | {
      kind: 'datetime_widget';
      id: string;
      prefillStart: string | null;
      durationMinutes: number;
      resolved: string | null;
    }
  | {
      kind: 'confirm_widget';
      id: string;
      start: string;
      durationMinutes: number;
      email: string;
      resolved: string | null;
    }
  | {
      kind: 'success';
      id: string;
      meetUrl: string;
      start: string;
      end: string;
      email: string;
    }
  | { kind: 'error'; id: string; text: string };
