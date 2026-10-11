"use client";

import { useId, useState } from "react";
import { money, signedPercent, trend } from "@/lib/format";

type Point = { label: string; value: number }; // label: "This week" / "Week to 11 Oct"

const TONE = { up: "text-forest", down: "text-crimson", flat: "text-ink-muted" } as const;

// A single-series line over weeks: price or value history, ending at "now".
// An optional reference line (what you paid) gives the line its meaning.
// Tap or drag to read any week; the table under it has the same numbers.
export function HistoryChart({
  points,
  currency,
  label,
  reference,
}: {
  points: Point[]; // oldest first
  currency: string;
  label: string; // what the line is, for screen readers
  reference?: { value: number; label: string };
}) {
  const [active, setActive] = useState<number | null>(null);
  const titleId = useId();

  if (points.length < 2) return null;

  const W = 360;
  const H = 176;
  const pad = { top: 18, right: 16, bottom: 24, left: 8 };
  const values = points.map((p) => p.value);
  const [lo, hi] = calmDomain([...values, ...(reference ? [reference.value] : [])]);
  const x = (i: number) => pad.left + (i / (points.length - 1)) * (W - pad.left - pad.right);
  const y = (v: number) => pad.top + (1 - (v - lo) / (hi - lo)) * (H - pad.top - pad.bottom);
  const ticks = [lo, (lo + hi) / 2, hi];
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join("");
  const last = points.length - 1;
  const shown = active ?? last;
  const periodPct = (points[last].value / points[0].value - 1) * 100;

  function pick(clientX: number, target: SVGSVGElement) {
    const box = target.getBoundingClientRect();
    const sx = ((clientX - box.left) / box.width) * W;
    const i = Math.round(((sx - pad.left) / (W - pad.left - pad.right)) * last);
    setActive(Math.max(0, Math.min(last, i)));
  }

  return (
    <figure className="flex flex-col gap-2">
      {/* With a reference line the chart already answers "how am I doing?",
          so the period change would only be a third percentage to read. */}
      {!reference && (
        <p className="text-body-sm text-ink-muted">
          <span className={`figures ${TONE[trend(periodPct)]}`}>{signedPercent(periodPct)}</span> over{" "}
          {last} {last === 1 ? "week" : "weeks"}
        </p>
      )}
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
          {`${label}: ${money(points[0].value, currency)} (${points[0].label}) to ${money(points[last].value, currency)} (${points[last].label})`}
          {reference ? `. ${reference.label}: ${money(reference.value, currency)}` : ""}
        </title>

        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={W - pad.right} y1={y(t)} y2={y(t)} className="stroke-hairline" strokeWidth={1} />
            <text x={pad.left} y={y(t) - 4} className="fill-ink-muted font-mono text-[10px]">
              {compact(t, currency)}
            </text>
          </g>
        ))}

        {reference && (
          <g>
            <line
              x1={pad.left}
              x2={W - pad.right}
              y1={y(reference.value)}
              y2={y(reference.value)}
              className="stroke-ink-muted"
              strokeWidth={1}
            />
            {/* Label on the open side: above the line in the lower half, below it
                in the upper half, so it never sits on the axis labels. */}
            <text
              x={W - pad.right}
              y={y(reference.value) + (y(reference.value) > H / 2 ? -5 : 12)}
              textAnchor="end"
              className="fill-ink-muted text-[10px]"
            >
              {reference.label} {compact(reference.value, currency)}
            </text>
          </g>
        )}

        <text x={pad.left} y={H - 6} className="fill-ink-muted font-mono text-[10px]">
          {points[0].label.replace("Week to ", "")}
        </text>
        <text x={W - pad.right} y={H - 6} textAnchor="end" className="fill-ink-muted font-mono text-[10px]">
          {points[last].label.replace("Week to ", "")}
        </text>

        <path d={path} fill="none" className="stroke-ink" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {active != null && (
          <line x1={x(active)} x2={x(active)} y1={pad.top} y2={H - pad.bottom} className="stroke-ink-muted" strokeWidth={1} />
        )}
        <circle cx={x(shown)} cy={y(points[shown].value)} r={4} className="fill-ink stroke-canvas" strokeWidth={2} />
      </svg>

      {/* Readout for the week under your finger. At rest it's a hint, since
          the latest value is already the headline above the chart. */}
      <figcaption className="flex min-h-6 items-baseline justify-between gap-4 text-body-sm" aria-live="polite">
        {active == null ? (
          <span className="text-ink-muted">Tap or drag on the chart to see any week.</span>
        ) : (
          <>
            <span className="figures font-medium">{money(points[active].value, currency)}</span>
            <span className="font-mono text-eyebrow text-ink-muted uppercase">{points[active].label}</span>
          </>
        )}
      </figcaption>
    </figure>
  );
}

// The vertical scale always spans at least 20% of the values shown, so an
// ordinary 2% week doesn't fill the chart and look like a cliff. Then round
// out to clean gridline values.
function calmDomain(values: number[]): [number, number] {
  let min = Math.min(...values);
  let max = Math.max(...values);
  // A little air below the lowest value so nothing sits on the bottom axis.
  min -= (max - min) * 0.08;
  const minSpan = Math.max(Math.abs(max) * 0.2, 1e-9);
  if (max - min < minSpan) {
    const mid = (max + min) / 2;
    min = mid - minSpan / 2;
    max = mid + minSpan / 2;
  }
  const span = max - min;
  const step = 10 ** Math.floor(Math.log10(span / 2));
  const nice = [1, 2, 2.5, 5, 10].map((m) => m * step).find((s) => span / s <= 4) ?? step * 10;
  return [Math.max(0, Math.floor(min / nice) * nice), Math.ceil(max / nice) * nice];
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
