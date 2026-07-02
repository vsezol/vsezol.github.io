import { useState } from 'react';

const EMAIL_RE = /^[\w.+-]+@[\w-]+(\.[\w-]+)+$/;

interface Props {
  prefill: string | null;
  disabled: boolean;
  onApprove: (email: string) => void;
  onDecline: () => void;
}

export default function EmailWidget({
  prefill,
  disabled,
  onApprove,
  onDecline,
}: Props) {
  const [email, setEmail] = useState(prefill ?? '');
  const [error, setError] = useState('');

  function approve() {
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setError("Hmm, that doesn't look like a valid email");
      return;
    }
    onApprove(value);
  }

  return (
    <div className="wcard">
      <div className="wlabel">Confirm email</div>
      <input
        className="winput"
        value={email}
        placeholder="you@example.com"
        inputMode="email"
        autoCapitalize="none"
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
          Approve
        </button>
        <button type="button" className="btn-ghost" disabled={disabled} onClick={onDecline}>
          Decline
        </button>
      </div>
    </div>
  );
}
