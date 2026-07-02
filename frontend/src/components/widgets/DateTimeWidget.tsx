import dayjs, { Dayjs } from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';

const ITEM_H = 40;
const DAY_START_HOUR = 8;
const DAY_END_HOUR = 22;
const STEP_MINUTES = 30;

function buildSlots(): string[] {
  const out: string[] = [];
  for (
    let t = DAY_START_HOUR * 60;
    t + STEP_MINUTES <= DAY_END_HOUR * 60;
    t += STEP_MINUTES
  ) {
    const h = String(Math.floor(t / 60)).padStart(2, '0');
    const m = String(t % 60).padStart(2, '0');
    out.push(`${h}:${m}`);
  }
  return out;
}

const SLOTS = buildSlots();

function nearestSlot(time: string): string {
  if (SLOTS.includes(time)) return time;
  const [h, m] = time.split(':').map(Number);
  const v = h * 60 + m;
  let best = SLOTS[0];
  let bestDiff = Infinity;
  for (const s of SLOTS) {
    const [a, b] = s.split(':').map(Number);
    const diff = Math.abs(a * 60 + b - v);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = s;
    }
  }
  return best;
}

interface Props {
  prefillStart: string | null;
  disabled: boolean;
  onApprove: (startIso: string) => void;
  onDecline: () => void;
}

export default function DateTimeWidget({
  prefillStart,
  disabled,
  onApprove,
  onDecline,
}: Props) {
  const today = dayjs().startOf('day');
  const initial = useMemo(() => {
    let d = prefillStart ? dayjs(prefillStart) : dayjs().add(1, 'day').hour(15).minute(0);
    if (d.isBefore(today)) d = dayjs().add(1, 'day').hour(15).minute(0);
    return { date: d.format('YYYY-MM-DD'), time: nearestSlot(d.format('HH:mm')) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [view, setView] = useState<Dayjs>(dayjs(initial.date).startOf('month'));
  const [selDate, setSelDate] = useState(initial.date);
  const [selTime, setSelTime] = useState(initial.time);

  const wheelRef = useRef<HTMLDivElement>(null);
  const wheelLock = useRef(false);
  const scrollTimer = useRef<number | undefined>(undefined);
  const lockTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const el = wheelRef.current;
    if (!el) return;
    const i = SLOTS.indexOf(selTime);
    if (i >= 0) {
      wheelLock.current = true;
      el.scrollTop = i * ITEM_H;
      window.setTimeout(() => {
        wheelLock.current = false;
      }, 350);
    }
    return () => {
      window.clearTimeout(scrollTimer.current);
      window.clearTimeout(lockTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onWheelScroll() {
    if (wheelLock.current || !wheelRef.current) return;
    window.clearTimeout(scrollTimer.current);
    scrollTimer.current = window.setTimeout(() => {
      const el = wheelRef.current;
      if (!el) return;
      const i = Math.max(
        0,
        Math.min(SLOTS.length - 1, Math.round(el.scrollTop / ITEM_H)),
      );
      if (SLOTS[i] && SLOTS[i] !== selTime) setSelTime(SLOTS[i]);
    }, 150);
  }

  function centerWheel(time: string) {
    const el = wheelRef.current;
    const i = SLOTS.indexOf(time);
    if (el && i >= 0) {
      wheelLock.current = true;
      el.scrollTo({ top: i * ITEM_H, behavior: 'smooth' });
      window.clearTimeout(lockTimer.current);
      lockTimer.current = window.setTimeout(() => {
        wheelLock.current = false;
      }, 450);
    }
  }

  const canPrev = view.isAfter(dayjs().startOf('month'));
  const canNext = view.isBefore(dayjs().add(3, 'month').startOf('month'));

  const days = useMemo(() => {
    const first = view.startOf('month');
    const offset = (first.day() + 6) % 7;
    const dim = view.daysInMonth();
    const cells: Array<{
      label: string;
      iso: string | null;
      disabled: boolean;
      isToday: boolean;
    }> = [];
    for (let i = 0; i < offset; i++) {
      cells.push({ label: '', iso: null, disabled: true, isToday: false });
    }
    for (let d = 1; d <= dim; d++) {
      const date = first.date(d);
      cells.push({
        label: String(d),
        iso: date.format('YYYY-MM-DD'),
        disabled: date.isBefore(today),
        isToday: date.isSame(today, 'day'),
      });
    }
    return cells;
  }, [view, today]);

  const selLabel = `${dayjs(selDate).format('ddd, MMM D')} · ${selTime}`;

  return (
    <div className="wcard dt">
      <div className="cal-head">
        <div className="cal-label">{view.format('MMMM YYYY')}</div>
        <div className="cal-nav">
          <button
            type="button"
            onClick={() => canPrev && setView(view.subtract(1, 'month'))}
            aria-label="Previous month"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => canNext && setView(view.add(1, 'month'))}
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      <div className="cal-dow">
        <span>Mo</span>
        <span>Tu</span>
        <span>We</span>
        <span>Th</span>
        <span>Fr</span>
        <span>Sa</span>
        <span>Su</span>
      </div>

      <div className="cal-grid">
        {days.map((d, i) => (
          <div
            key={i}
            className={[
              'cal-day',
              d.disabled ? 'disabled' : '',
              d.isToday ? 'today' : '',
              d.iso === selDate ? 'selected' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => {
              if (!d.disabled && d.iso) setSelDate(d.iso);
            }}
          >
            {d.label}
          </div>
        ))}
      </div>

      <div className="divider" />

      <div className="wheel-wrap">
        <div className="wheel-highlight" />
        <div className="wheel-fade-top" />
        <div className="wheel-fade-bottom" />
        <div className="wheel" ref={wheelRef} onScroll={onWheelScroll}>
          {SLOTS.map((t) => (
            <div
              key={t}
              className={`wheel-item${t === selTime ? ' selected' : ''}`}
              onClick={() => {
                setSelTime(t);
                centerWheel(t);
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>

      <div className="sel-label">{selLabel}</div>

      <div className="wbtns">
        <button
          type="button"
          className="btn-primary"
          disabled={disabled}
          onClick={() =>
            onApprove(dayjs(`${selDate}T${selTime}`).format('YYYY-MM-DDTHH:mm:ssZ'))
          }
        >
          Approve
        </button>
        <button type="button" className="btn-ghost" disabled={disabled} onClick={onDecline}>
          Decline
        </button>
      </div>
    </div>
  );
}
