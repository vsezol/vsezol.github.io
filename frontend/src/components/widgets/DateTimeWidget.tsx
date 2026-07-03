import dayjs, { Dayjs } from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { fmtDay } from '../../locale';
import type { DayCfg } from '../../types';

const ITEM_H = 40;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function buildSlotsFor(
  dateIso: string,
  schedule: DayCfg[],
  step: number,
): string[] {
  let from = 8 * 60;
  let to = 22 * 60;
  if (schedule.length === 7) {
    const day = schedule[(dayjs(dateIso).day() + 6) % 7];
    if (day.on) {
      from = toMinutes(day.start);
      to = toMinutes(day.end);
    }
  }
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

const DOW: Record<'en' | 'ru', string[]> = {
  en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
  ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
};

const BTNS = {
  en: { approve: 'Approve', decline: 'Decline' },
  ru: { approve: 'Подтвердить', decline: 'Отклонить' },
};

interface Props {
  prefillStart: string | null;
  disabled: boolean;
  lang?: 'en' | 'ru';
  slotMinutes: number;
  schedule: DayCfg[];
  onApprove: (startIso: string) => void;
  onDecline: () => void;
}

export default function DateTimeWidget({
  prefillStart,
  disabled,
  lang = 'en',
  slotMinutes,
  schedule,
  onApprove,
  onDecline,
}: Props) {
  const today = dayjs().startOf('day');

  const dayOff = (d: Dayjs) =>
    schedule.length === 7 ? !schedule[(d.day() + 6) % 7].on : false;

  const initial = useMemo(() => {
    let d = prefillStart
      ? dayjs(prefillStart)
      : dayjs().add(1, 'day').hour(15).minute(0);
    if (d.isBefore(today)) d = dayjs().add(1, 'day').hour(15).minute(0);
    let guard = 0;
    while (dayOff(d) && guard++ < 14) d = d.add(1, 'day');
    const date = d.format('YYYY-MM-DD');
    return {
      date,
      time: nearestSlot(
        buildSlotsFor(date, schedule, slotMinutes),
        d.format('HH:mm'),
      ),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [view, setView] = useState<Dayjs>(dayjs(initial.date).startOf('month'));
  const [selDate, setSelDate] = useState(initial.date);
  const [selTime, setSelTime] = useState(initial.time);

  // the wheel window follows the selected day's schedule
  const slots = useMemo(
    () => buildSlotsFor(selDate, schedule, slotMinutes),
    [selDate, schedule, slotMinutes],
  );

  const wheelRef = useRef<HTMLDivElement>(null);
  const wheelLock = useRef(false);
  const scrollTimer = useRef<number | undefined>(undefined);
  const lockTimer = useRef<number | undefined>(undefined);

  function centerInstant(time: string, list: string[]) {
    const el = wheelRef.current;
    const i = list.indexOf(time);
    if (el && i >= 0) {
      wheelLock.current = true;
      el.scrollTop = i * ITEM_H;
      window.setTimeout(() => {
        wheelLock.current = false;
      }, 350);
    }
  }

  useEffect(() => {
    // snap the selected time to the (possibly new) day's slot list
    const snapped = nearestSlot(slots, selTime);
    if (snapped !== selTime) setSelTime(snapped);
    centerInstant(snapped, slots);
    return () => {
      window.clearTimeout(scrollTimer.current);
      window.clearTimeout(lockTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots]);

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

  const selLabel = `${fmtDay(dayjs(selDate), lang)} · ${selTime}`;

  return (
    <div className="wcard dt">
      <div className="cal-head">
        <div className="cal-label">{view.locale(lang).format('MMMM YYYY')}</div>
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
        {DOW[lang].map((d) => (
          <span key={d}>{d}</span>
        ))}
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
          {BTNS[lang].approve}
        </button>
        <button type="button" className="btn-ghost" disabled={disabled} onClick={onDecline}>
          {BTNS[lang].decline}
        </button>
      </div>
    </div>
  );
}
