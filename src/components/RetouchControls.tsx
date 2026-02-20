'use client';

import { RetouchSettings, DEFAULT_RETOUCH } from '@/types';

interface RetouchControlsProps {
  settings: RetouchSettings;
  onChange: (settings: RetouchSettings) => void;
}

interface SliderConfig {
  key: keyof RetouchSettings;
  label: string;
  icon: string;
}

const SLIDERS: SliderConfig[] = [
  { key: 'brightness', label: '明るさ', icon: '☀️' },
  { key: 'contrast', label: 'コントラスト', icon: '◐' },
  { key: 'saturate', label: '彩度', icon: '🎨' },
];

export default function RetouchControls({ settings, onChange }: RetouchControlsProps) {
  const handleChange = (key: keyof RetouchSettings, value: number) => {
    onChange({ ...settings, [key]: value });
  };

  const handleReset = () => {
    onChange({ ...DEFAULT_RETOUCH });
  };

  const isModified =
    settings.brightness !== DEFAULT_RETOUCH.brightness ||
    settings.contrast !== DEFAULT_RETOUCH.contrast ||
    settings.saturate !== DEFAULT_RETOUCH.saturate;

  return (
    <div className="retouch-panel">
      <div className="retouch-header">
        <span className="retouch-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          レタッチ
        </span>
        {isModified && (
          <button
            className="retouch-reset-btn"
            onClick={handleReset}
            type="button"
            aria-label="レタッチ設定をリセット"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            リセット
          </button>
        )}
      </div>
      <div className="retouch-sliders">
        {SLIDERS.map(({ key, label, icon }) => (
          <div key={key} className="retouch-slider-group">
            <div className="retouch-slider-label">
              <span className="retouch-slider-icon" aria-hidden="true">{icon}</span>
              <span>{label}</span>
              <span className="retouch-slider-value">{settings[key]}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={settings[key]}
              onChange={(e) => handleChange(key, Number(e.target.value))}
              className="retouch-slider"
              aria-label={`${label}を調整`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
