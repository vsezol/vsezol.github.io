import { useEffect, useRef, useState } from 'react';
import type { AdminConfig, ButtonCfg, DayCfg } from '../types';

const CONFIG_URL = `${window.location.origin}/admin/api/config`;
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOT_OPTS = [15, 30, 45, 60] as const;
const DEFAULT_AVATAR = 'https://vsezol.com/my-avatar.webp';

function timeOptions(): string[] {
  const out: string[] = [];
  for (let t = 6 * 60; t <= 23 * 60 + 30; t += 30) {
    out.push(
      `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`,
    );
  }
  return out;
}

const TIME_OPTS = timeOptions();

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export default function AdminApp() {
  const [cfg, setCfg] = useState<AdminConfig | null>(null);
  const [loadError, setLoadError] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState('');
  const saveTimer = useRef<number | undefined>(undefined);

  async function load() {
    setLoadError('');
    try {
      const res = await fetch(CONFIG_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setCfg(await res.json());
    } catch (err) {
      setLoadError(String(err));
    }
  }

  useEffect(() => {
    void load();
    return () => window.clearTimeout(saveTimer.current);
  }, []);

  if (loadError) {
    return (
      <div className="adm-wrap">
        <div className="adm-col">
          <div className="adm-loading">
            Failed to load the config ({loadError}).{' '}
            <button className="adm-btn-muted" onClick={() => void load()}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!cfg) {
    return (
      <div className="adm-wrap">
        <div className="adm-col">
          <div className="adm-loading">Loading…</div>
        </div>
      </div>
    );
  }

  const patch = (p: Partial<AdminConfig>) =>
    setCfg((c) => (c ? { ...c, ...p } : c));

  const patchButton = (i: number, p: Partial<ButtonCfg>) =>
    patch({
      buttons: cfg.buttons.map((b, j) => (j === i ? { ...b, ...p } : b)),
    });

  const moveButton = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= cfg.buttons.length) return;
    const next = [...cfg.buttons];
    [next[i], next[j]] = [next[j], next[i]];
    patch({ buttons: next });
  };

  const patchDay = (i: number, p: Partial<DayCfg>) =>
    patch({
      schedule: cfg.schedule.map((d, j) => (j === i ? { ...d, ...p } : d)),
    });

  function onAvatarFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 192;
        const ctx = canvas.getContext('2d')!;
        const side = Math.min(img.width, img.height);
        ctx.drawImage(
          img,
          (img.width - side) / 2,
          (img.height - side) / 2,
          side,
          side,
          0,
          0,
          192,
          192,
        );
        patch({ avatar: canvas.toDataURL('image/jpeg', 0.85) });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  async function save() {
    setSaveState('saving');
    setSaveError('');
    try {
      const res = await fetch(CONFIG_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body.detail ? JSON.stringify(body.detail).slice(0, 120) : `HTTP ${res.status}`,
        );
      }
      setSaveState('saved');
    } catch (err) {
      setSaveState('error');
      setSaveError(String(err instanceof Error ? err.message : err));
    }
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => setSaveState('idle'), 2500);
  }

  const saveLabel =
    saveState === 'saving'
      ? 'Saving…'
      : saveState === 'saved'
        ? 'Saved ✓'
        : saveState === 'error'
          ? `Error: ${saveError}`
          : 'Save';

  return (
    <div className="adm-wrap">
      <div className="adm-col">
        <div className="adm-head">
          <div>
            <div className="adm-h1">Agent Admin</div>
            <div className="adm-hsub">Changes apply to the chat after saving</div>
          </div>
          <a
            className="adm-open-chat"
            href="https://vsezol.com"
            target="_blank"
            rel="noreferrer"
          >
            Open chat ↗
          </a>
        </div>

        <div className="adm-card">
          <div className="adm-label">Profile</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div
              className="adm-avatar"
              style={{ backgroundImage: `url("${cfg.avatar || DEFAULT_AVATAR}")` }}
            />
            <label className="adm-btn-file">
              Replace photo
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onAvatarFile(f);
                  e.target.value = '';
                }}
              />
            </label>
            {cfg.avatar && (
              <button
                type="button"
                className="adm-btn-muted"
                onClick={() => patch({ avatar: null })}
              >
                Restore default
              </button>
            )}
          </div>
          <div>
            <div className="adm-field-label">Title (agent name)</div>
            <input
              className="adm-input"
              maxLength={60}
              value={cfg.title}
              onChange={(e) => patch({ title: e.target.value })}
            />
          </div>
          <div>
            <div className="adm-field-label">Subtitle</div>
            <input
              className="adm-input"
              maxLength={100}
              value={cfg.subtitle}
              onChange={(e) => patch({ subtitle: e.target.value })}
            />
          </div>
        </div>

        <div className="adm-card">
          <div className="adm-label">Greeting</div>
          <div className="adm-hint">The agent's first message when the site opens</div>
          <textarea
            className="adm-textarea"
            rows={4}
            maxLength={1000}
            value={cfg.greeting}
            onChange={(e) => patch({ greeting: e.target.value })}
          />
        </div>

        <div className="adm-card">
          <div className="adm-label">Buttons under the greeting</div>
          {cfg.buttons.map((b, i) => (
            <div className="adm-btn-row" key={i}>
              <input
                className="adm-input"
                placeholder="Button label"
                maxLength={40}
                value={b.label}
                onChange={(e) => patchButton(i, { label: e.target.value })}
              />
              <select
                className="adm-select"
                value={b.kind}
                onChange={(e) =>
                  patchButton(i, { kind: e.target.value as ButtonCfg['kind'] })
                }
              >
                <option value="link">Link</option>
                <option value="about">Action: about me</option>
              </select>
              {b.kind === 'link' && (
                <input
                  className="adm-input url"
                  placeholder="https://…"
                  maxLength={300}
                  value={b.url}
                  onChange={(e) => patchButton(i, { url: e.target.value })}
                />
              )}
              <div style={{ display: 'flex', gap: 6, flex: 'none' }}>
                <button type="button" className="adm-icon-btn" onClick={() => moveButton(i, -1)}>
                  ↑
                </button>
                <button type="button" className="adm-icon-btn" onClick={() => moveButton(i, 1)}>
                  ↓
                </button>
                <button
                  type="button"
                  className="adm-icon-btn del"
                  onClick={() => patch({ buttons: cfg.buttons.filter((_, j) => j !== i) })}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          {cfg.buttons.length < 8 && (
            <button
              type="button"
              className="adm-add-btn"
              onClick={() =>
                patch({
                  buttons: [...cfg.buttons, { label: 'New button', kind: 'link', url: '' }],
                })
              }
            >
              + Add button
            </button>
          )}
        </div>

        <div className="adm-card">
          <div className="adm-label">Availability</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {cfg.schedule.map((d, i) => (
              <div className="adm-day" key={i}>
                <div className={`adm-day-name${d.on ? '' : ' off'}`}>{DAY_NAMES[i]}</div>
                <button
                  type="button"
                  className={`adm-switch${d.on ? ' on' : ''}`}
                  onClick={() => patchDay(i, { on: !d.on })}
                  aria-label={`Toggle ${DAY_NAMES[i]}`}
                >
                  <span className="adm-knob" />
                </button>
                <select
                  className="adm-select"
                  disabled={!d.on}
                  value={d.start}
                  onChange={(e) => patchDay(i, { start: e.target.value })}
                >
                  {TIME_OPTS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <div className="adm-dash">—</div>
                <select
                  className="adm-select"
                  disabled={!d.on}
                  value={d.end}
                  onChange={(e) => patchDay(i, { end: e.target.value })}
                >
                  {TIME_OPTS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="adm-divider" />
          <div>
            <div className="adm-field-label">Slot duration</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SLOT_OPTS.map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`adm-slot-btn${cfg.slot_minutes === v ? ' sel' : ''}`}
                  onClick={() => patch({ slot_minutes: v })}
                >
                  {v} min
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="adm-field-label">Timezone (shown in the confirmation)</div>
            <input
              className="adm-input"
              maxLength={60}
              value={cfg.tz_label}
              onChange={(e) => patch({ tz_label: e.target.value })}
            />
          </div>
        </div>

        <div className="adm-card">
          <div className="adm-label">About me — agent knowledge base</div>
          <div className="adm-hint">
            Experience, stack, projects — the agent answers questions about you from
            this text
          </div>
          <textarea
            className="adm-textarea"
            rows={9}
            maxLength={8000}
            placeholder="e.g. Senior AI Engineer, 8 years in ML. I build LLM agents and RAG systems in Python…"
            value={cfg.bio}
            onChange={(e) => patch({ bio: e.target.value })}
          />
        </div>

        <div className="adm-savebar">
          <div className="adm-savebar-in">
            <button type="button" className="adm-save" onClick={() => void save()}>
              {saveLabel}
            </button>
            <button
              type="button"
              className="adm-reset"
              onClick={() => {
                if (confirm('Reload the saved config and discard local edits?')) {
                  void load();
                }
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
