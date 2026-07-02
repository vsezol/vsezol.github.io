import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';

interface Props {
  meetUrl: string;
  start: string;
  email: string;
}

export default function SuccessCard({ meetUrl, start, email }: Props) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const when = dayjs(start).format('ddd, MMM D · HH:mm');
  const displayUrl = meetUrl.replace(/^https?:\/\//, '');

  function copy() {
    try {
      void navigator.clipboard.writeText(meetUrl);
    } catch {
      /* clipboard unavailable */
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="success-card">
      <div className="success-head">
        <span className="success-check">✓</span>
        <span className="success-title">Meeting booked</span>
      </div>
      <div className="success-text">
        {when} — invitations sent to {email} and Vsevolod's calendar.
      </div>
      <button type="button" className="copy-btn" onClick={copy}>
        <span className="copy-url">{displayUrl}</span>
        {copied ? (
          <span className="copy-done">✓</span>
        ) : (
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flex: 'none', display: 'block' }}>
            <rect x="5.5" y="5.5" width="8" height="8" rx="2" stroke="#8B94A6" strokeWidth="1.4" />
            <path
              d="M10.5 3.5v-1a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 2.5V8A1.5 1.5 0 0 0 4 9.5h1"
              stroke="#8B94A6"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
