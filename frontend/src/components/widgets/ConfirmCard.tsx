import dayjs from 'dayjs';

interface Props {
  start: string;
  durationMinutes: number;
  email: string;
  tzLabel?: string;
  disabled: boolean;
  onBook: () => void;
  onDecline: () => void;
}

export default function ConfirmCard({
  start,
  durationMinutes,
  email,
  tzLabel,
  disabled,
  onBook,
  onDecline,
}: Props) {
  const startAt = dayjs(start);
  const endAt = startAt.add(durationMinutes, 'minute');
  const when = `${startAt.format('ddd, MMM D')} · ${startAt.format('HH:mm')}–${endAt.format('HH:mm')}`;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || tzLabel || '';

  return (
    <div className="wcard">
      <div className="confirm-title">Meeting with Vsevolod Zolotov</div>
      <div className="confirm-rows">
        <div className="crow">
          <span className="k">When</span>
          <span className="v">{when}</span>
        </div>
        <div className="crow">
          <span className="k">Timezone</span>
          <span className="v">{tz}</span>
        </div>
        <div className="crow">
          <span className="k">Guest</span>
          <span className="v">{email}</span>
        </div>
        <div className="crow">
          <span className="k">Where</span>
          <span className="v">Google Meet</span>
        </div>
      </div>
      <button type="button" className="btn-book" disabled={disabled} onClick={onBook}>
        Book the meeting
      </button>
      <button type="button" className="btn-text" disabled={disabled} onClick={onDecline}>
        Decline
      </button>
    </div>
  );
}
