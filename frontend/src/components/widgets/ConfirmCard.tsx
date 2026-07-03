import dayjs from 'dayjs';
import i18n from '../../i18n';
import { fmtDay } from '../../locale';

interface Props {
  start: string;
  durationMinutes: number;
  email: string;
  tzLabel?: string;
  disabled: boolean;
  lang?: 'en' | 'ru';
  onBook: () => void;
  onDecline: () => void;
}

export default function ConfirmCard({
  start,
  durationMinutes,
  email,
  tzLabel,
  disabled,
  lang = 'en',
  onBook,
  onDecline,
}: Props) {
  const t = i18n.getFixedT(lang);
  const startAt = dayjs(start);
  const endAt = startAt.add(durationMinutes, 'minute');
  const when = `${fmtDay(startAt, lang)} · ${startAt.format('HH:mm')}–${endAt.format('HH:mm')}`;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || tzLabel || '';

  return (
    <div className="wcard">
      <div className="confirm-title">{t('confirm.title')}</div>
      <div className="confirm-rows">
        <div className="crow">
          <span className="k">{t('confirm.when')}</span>
          <span className="v">{when}</span>
        </div>
        <div className="crow">
          <span className="k">{t('confirm.timezone')}</span>
          <span className="v">{tz}</span>
        </div>
        <div className="crow">
          <span className="k">{t('confirm.guest')}</span>
          <span className="v">{email}</span>
        </div>
        <div className="crow">
          <span className="k">{t('confirm.where')}</span>
          <span className="v">Google Meet</span>
        </div>
      </div>
      <button type="button" className="btn-book" disabled={disabled} onClick={onBook}>
        {t('confirm.book')}
      </button>
      <button type="button" className="btn-text" disabled={disabled} onClick={onDecline}>
        {t('widget.decline')}
      </button>
    </div>
  );
}
