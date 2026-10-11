"use client";

import { useId, useState } from "react";
import { dayMonth, money, shortDate } from "@/lib/format";

type Point = { date: string; value: number };

// A single-series line over weeks: price or value history. Tap or drag on it
// to read any week; the table under it carries the same numbers.
export function HistoryChart({
  points,
  currency,
  label,
}: {
  points: Point[]; // oldest first
  currency: string;
  label: string; // what the line is, for screen readers
}) {
  const [active, setActive] = useState<number | null>(null);
  const titleId = useId();

  if (points.length < 2) return null;

  const W = 360;
  const H = 168;
  const pad = { top: 16, right: 16, bottom: 24, left: 8 };
  const values = points.map((p) => p.value);
  const [lo, hi] = niceDomain(Math.min(...values), Math.max(...values));
  const x = (i: number) => pad.left + (i / (points.length - 1)) * (W - pad.left - pad.right);
  const y = (v: number) => pad.top + (1 - (v - lo) / (hi - lo)) * (H - pad.top - pad.bottom);
  const ticks = [lo, (lo + hi) / 2, hi];
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join("");
  const last = points.length - 1;
  const shown = active ?? last;

  function pick(clientX: number, target: SVGSVGElement) {
    const box = target.getBoundingClientRect();
    const sx = ((clientX - box.left) / box.width) * W;
    const i = Math.round(((sx - pad.left) / (W - pad.left - pad.right)) * last);
    setActive(Math.max(0, Math.min(last, i)));
  }

  return (
    <figure className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none select-none overflow-visible outline-none focus-visible:ring-2 focus-visible:ring-ember"
        role="img"
        aria-labelledby={titleId}
        tabIndex={0}
        onPointerDown={(e) => pick(e.clientX, e.currentTarget)}
        onPointerMove={(e) => pick(e.clientX, e.currentTarget)}
        // A lifted finger counts as "leaving"; keep the reading on touch screens.
        onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
        onBlur={() => setActive(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setActive(Math.max(0, shown - 1));
          if (e.key === "ArrowRight") setActive(Math.min(last, shown + 1));
        }}
      >
        <title id={titleId}>
          {`${label}: ${money(points[0].value, currency)} on ${shortDate(points[0].date)}, ${money(points[last].value, currency)} on ${shortDate(points[last].date)}`}
        </title>

        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={W - pad.right} y1={y(t)} y2={y(t)} className="stroke-hairline" strokeWidth={1} />
            <text x={pad.left} y={y(t) - 4} className="fill-ink-muted font-mono text-[10px]">
              {compact(t, currency)}
            </text>
          </g>
        ))}

        <text x={pad.left} y={H - 6} className="fill-ink-muted font-mono text-[10px]">
          {dayMonth(points[0].date)}
        </text>
        <text x={W - pad.right} y={H - 6} textAnchor="end" className="fill-ink-muted font-mono text-[10px]">
          {dayMonth(points[last].date)}
        </text>

        <path d={path} fill="none" className="stroke-ink" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {active != null && (
          <line x1={x(active)} x2={x(active)} y1={pad.top} y2={H - pad.bottom} className="stroke-ink-muted" strokeWidth={1} />
        )}
        <circle cx={x(shown)} cy={y(points[shown].value)} r={4} className="fill-ink stroke-card" strokeWidth={2} />
      </svg>

      {/* Readout: the latest value, or the week under your finger. */}
      <figcaption className="mt-2 flex items-baseline justify-between gap-4 text-body-sm" aria-live="polite">
        <span className="figures font-medium">{money(points[shown].value, currency)}</span>
        <span className="font-mono text-eyebrow text-ink-muted uppercase">
          {active == null ? "Latest · " : ""}week of {shortDate(points[shown].date)}
        </span>
      </figcaption>
    </figure>
  );
}

// Round the range out to clean numbers so gridlines land on tidy values.
function niceDomain(min: number, max: number): [number, number] {
  if (min === max) return [min * 0.95, max * 1.05 || 1];
  const span = max - min;
  const step = 10 ** Math.floor(Math.log10(span / 2));
  const nice = [1, 2, 2.5, 5, 10].map((m) => m * step).find((s) => span / s <= 4) ?? step * 10;
  return [Math.floor(min / nice) * nice, Math.ceil(max / nice) * nice];
}

function compact(n: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    notation: "compact",
    // Three significant digits keeps close gridlines apart (₦1.53M, ₦1.56M).
    maximumSignificantDigits: 3,
  }).format(n);
}
