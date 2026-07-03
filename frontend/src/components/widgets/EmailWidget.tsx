import { useState } from 'react';
import i18n from '../../i18n';

const EMAIL_RE = /^[\w.+-]+@[\w-]+(\.[\w-]+)+$/;

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
  const t = i18n.getFixedT(lang);

  function approve() {
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setError(t('email.invalid'));
      return;
    }
    onApprove(value);
  }

  return (
    <div className="wcard">
      <div className="wlabel">{t('email.label')}</div>
      <input
        className="winput"
        type="email"
        name="email"
        autoComplete="email"
        inputMode="email"
        autoCapitalize="none"
        spellCheck={false}
        value={email}
        placeholder={t('email.placeholder')}
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
          {t('widget.approve')}
        </button>
        <button type="button" className="btn-ghost" disabled={disabled} onClick={onDecline}>
          {t('widget.decline')}
        </button>
      </div>
    </div>
  );
}
