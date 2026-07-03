import dayjs from 'dayjs';
import { fmtDay } from '../../locale';

const T = {
  en: {
    title: 'Meeting with Vsevolod Zolotov',
    when: 'When',
    timezone: 'Timezone',
    guest: 'Guest',
    where: 'Where',
    book: 'Book the meeting',
    decline: 'Decline',
  },
  ru: {
    title: 'Встреча со Всеволодом Золотовым',
    when: 'Когда',
    timezone: 'Часовой пояс',
    guest: 'Гость',
    where: 'Где',
    book: 'Забронировать встречу',
    decline: 'Отклонить',
  },
};

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
  const t = T[lang];
  const startAt = dayjs(start);
  const endAt = startAt.add(durationMinutes, 'minute');
  const when = `${fmtDay(startAt, lang)} · ${startAt.format('HH:mm')}–${endAt.format('HH:mm')}`;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || tzLabel || '';

  return (
    <div className="wcard">
      <div className="confirm-title">{t.title}</div>
      <div className="confirm-rows">
        <div className="crow">
          <span className="k">{t.when}</span>
          <span className="v">{when}</span>
        </div>
        <div className="crow">
          <span className="k">{t.timezone}</span>
          <span className="v">{tz}</span>
        </div>
        <div className="crow">
          <span className="k">{t.guest}</span>
          <span className="v">{email}</span>
        </div>
        <div className="crow">
          <span className="k">{t.where}</span>
          <span className="v">Google Meet</span>
        </div>
      </div>
      <button type="button" className="btn-book" disabled={disabled} onClick={onBook}>
        {t.book}
      </button>
      <button type="button" className="btn-text" disabled={disabled} onClick={onDecline}>
        {t.decline}
      </button>
    </div>
  );
}
