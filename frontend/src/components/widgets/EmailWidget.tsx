import { useState } from 'react';

const EMAIL_RE = /^[\w.+-]+@[\w-]+(\.[\w-]+)+$/;

const T = {
  en: {
    label: 'Confirm email',
    error: "Hmm, that doesn't look like a valid email",
    approve: 'Approve',
    decline: 'Decline',
  },
  ru: {
    label: 'Подтвердите почту',
    error: 'Хм, это не похоже на настоящую почту',
    approve: 'Подтвердить',
    decline: 'Отклонить',
  },
};

interface Props {
  prefill: string | null;
  disabled: boolean;
  lang?: 'en' | 'ru';
  onApprove: (email: string) => void;
  onDecline: () => void;
}

export default function EmailWidget({
  prefill,
  disabled,
  lang = 'en',
  onApprove,
  onDecline,
}: Props) {
  const [email, setEmail] = useState(prefill ?? '');
  const [error, setError] = useState('');
  const t = T[lang];

  function approve() {
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setError(t.error);
      return;
    }
    onApprove(value);
  }

  return (
    <div className="wcard">
      <div className="wlabel">{t.label}</div>
      <input
        className="winput"
        type="email"
        name="email"
        autoComplete="email"
        inputMode="email"
        autoCapitalize="none"
        spellCheck={false}
        value={email}
        placeholder="you@example.com"
        disabled={disabled}
        onChange={(e) => {
          setEmail(e.target.value);
          setError('');
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') approve();
        }}
      />
      {error && <div className="werror">{error}</div>}
      <div className="wbtns">
        <button type="button" className="btn-primary" disabled={disabled} onClick={approve}>
          {t.approve}
        </button>
        <button type="button" className="btn-ghost" disabled={disabled} onClick={onDecline}>
          {t.decline}
        </button>
      </div>
    </div>
  );
}
