import type { ReactNode } from "react";
import { fmtNum, trendLabel, type TrendKind } from "../engine";

export function Emblem({ size = 40 }: { size?: number }) {
  return (
    <svg className="hero-mark" width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="14" fill="#0b141c" stroke="#d4b06a" />
      <path d="M8 44c8-3 14-16 24-16s16 13 24 16" fill="none" stroke="#d4b06a" strokeWidth="3" />
      <circle cx="32" cy="22" r="8" fill="#3dbea5" />
      <path d="M32 10v4M32 30v4M20 22h4M40 22h4" stroke="#d4b06a" strokeWidth="2" />
    </svg>
  );
}

export function Trend({ kind }: { kind: TrendKind }) {
  const arrow = kind === "up" ? "▲" : kind === "down" ? "▼" : "–";
  return (
    <span className={`trend ${kind}`}>
      {arrow} {trendLabel(kind)}
    </span>
  );
}

export function MetricCard(props: {
  label: string;
  value: string;
  hint?: string;
  trend?: TrendKind;
  children?: ReactNode;
}) {
  return (
    <article className="card">
      <div className="metric-kicker">{props.label}</div>
      <div className="metric-value">{props.value}</div>
      <div className="row">
        {props.hint ? <span className="tiny muted">{props.hint}</span> : <span />}
        {props.trend ? <Trend kind={props.trend} /> : null}
      </div>
      {props.children}
    </article>
  );
}

export function Bar({ value, max = 100, tone }: { value: number; max?: number; tone?: "warn" | "danger" }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={`bar ${tone ?? ""}`}>
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}

export function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="row tiny">
      <span className="muted">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function LineChart({
  values,
  labels,
  color = "#3dbea5",
  tall,
}: {
  values: number[];
  labels?: string[];
  color?: string;
  tall?: boolean;
}) {
  const w = 320;
  const h = tall ? 200 : 140;
  const pad = 12;
  if (values.length < 2) {
    return <p className="muted tiny">لا يتوفر تاريخ كافٍ للرسم بعد.</p>;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / span) * (h - pad * 2);
    return `${x},${y}`;
  });
  return (
    <svg className={`chart ${tall ? "tall" : ""}`} viewBox={`0 0 ${w} ${h}`} role="img">
      <polyline fill="none" stroke={color} strokeWidth="2.2" points={pts.join(" ")} />
      {labels?.length ? (
        <text x={w - pad} y={h - 2} fill="#93a09a" fontSize="10" textAnchor="end">
          {labels[labels.length - 1]}
        </text>
      ) : null}
      <text x={pad} y={12} fill="#93a09a" fontSize="10">
        {fmtNum(max, max >= 100 ? 0 : 1)}
      </text>
    </svg>
  );
}

export function Slider(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (n: number) => void;
}) {
  return (
    <div className="slider-block">
      <label>
        <span>{props.label}</span>
        <strong>{props.display}</strong>
      </label>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
      />
    </div>
  );
}
