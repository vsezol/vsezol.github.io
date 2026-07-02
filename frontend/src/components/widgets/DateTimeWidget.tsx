import dayjs, { Dayjs } from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { DayCfg } from '../../types';

const ITEM_H = 40;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function buildSlots(schedule: DayCfg[], step: number): string[] {
  const enabled = schedule.filter((d) => d.on);
  const from = enabled.length
    ? Math.min(...enabled.map((d) => toMinutes(d.start)))
    : 8 * 60;
  const to = enabled.length
    ? Math.max(...enabled.map((d) => toMinutes(d.end)))
    : 22 * 60;
  const out: string[] = [];
  for (let t = from; t + step <= to; t += step) {
    const h = String(Math.floor(t / 60)).padStart(2, '0');
    const m = String(t % 60).padStart(2, '0');
    out.push(`${h}:${m}`);
  }
  return out.length ? out : ['15:00'];
}

function nearestSlot(slots: string[], time: string): string {
  if (slots.includes(time)) return time;
  const v = toMinutes(time);
  let best = slots[0];
  let bestDiff = Infinity;
  for (const s of slots) {
    const diff = Math.abs(toMinutes(s) - v);
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
  slotMinutes: number;
  schedule: DayCfg[];
  onApprove: (startIso: string) => void;
  onDecline: () => void;
}

export default function DateTimeWidget({
  prefillStart,
  disabled,
  slotMinutes,
  schedule,
  onApprove,
  onDecline,
}: Props) {
  const today = dayjs().startOf('day');
  const slots = useMemo(
    () => buildSlots(schedule, slotMinutes),
    [schedule, slotMinutes],
  );

  const dayOff = (d: Dayjs) =>
    schedule.length === 7 ? !schedule[(d.day() + 6) % 7].on : false;

  const initial = useMemo(() => {
    let d = prefillStart
      ? dayjs(prefillStart)
      : dayjs().add(1, 'day').hour(15).minute(0);
    if (d.isBefore(today)) d = dayjs().add(1, 'day').hour(15).minute(0);
    let guard = 0;
    while (dayOff(d) && guard++ < 14) d = d.add(1, 'day');
    return {
      date: d.format('YYYY-MM-DD'),
      time: nearestSlot(slots, d.format('HH:mm')),
    };
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
    const i = slots.indexOf(selTime);
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
        Math.min(slots.length - 1, Math.round(el.scrollTop / ITEM_H)),
      );
      if (slots[i] && slots[i] !== selTime) setSelTime(slots[i]);
    }, 150);
  }

  function centerWheel(time: string) {
    const el = wheelRef.current;
    const i = slots.indexOf(time);
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
        disabled: date.isBefore(today) || dayOff(date),
        isToday: date.isSame(today, 'day'),
      });
    }
    return cells;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, today, schedule]);

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
          {slots.map((t) => (
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
