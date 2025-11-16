"use client";

import { useState } from "react";

type Props = {
  score: number;
  id?: string;
  size?: "sm" | "md";
  details?: {
    gini?: number;
    hhi?: number;
    nakamoto?: number;
    liquidity?: number;
    governance?: number;
    ownership?: number;
    controlRisk?: number;
  };
};

const SIZE_MAP = {
  sm: { svg: 50, radius: 18, stroke: 5, font: 11 },
  md: { svg: 60, radius: 20, stroke: 6, font: 12 },
};

export default function ScoreIndicator({ score, id, size = "md", details }: Props) {
  const [showTooltip, setShowTooltip] = useState(false);

  const tone =
    score >= 85
      ? { label: "Prime", color: "#3fe081" }
      : score >= 70
        ? { label: "Watch", color: "#f7c548" }
        : { label: "Review", color: "#ff8a5c" };

  const normalized = Math.min(Math.max(score, 0), 100);
  const { svg, radius, stroke, font } = SIZE_MAP[size];
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalized / 100) * circumference;
  const gradientId = `score-indicator-${id ?? normalized}`;

  return (
    <div className="relative flex items-center gap-3">
      <div
        className="relative"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <svg viewBox={`0 0 ${svg} ${svg}`} className="h-12 w-12 cursor-help">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3fe081" />
              <stop offset="100%" stopColor="#c784ff" />
            </linearGradient>
          </defs>
          <circle
            cx={svg / 2}
            cy={svg / 2}
            r={radius}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={stroke}
            fill="transparent"
          />
          <circle
            cx={svg / 2}
            cy={svg / 2}
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            fill="transparent"
          />
          <text
            x={svg / 2}
            y={svg / 2 + font / 3}
            textAnchor="middle"
            fontSize={font}
            fill="white"
            fontWeight={600}
          >
            {score}
          </text>
        </svg>

        {showTooltip && details && (
          <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-2xl border border-white/10 bg-[color:var(--color-bg-card)] p-4 shadow-xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-white">
              Benchmark Breakdown
            </p>
            <div className="space-y-2 text-xs">
              {details.ownership !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-[color:var(--color-text-secondary)]">Ownership</span>
                  <span className="font-semibold text-white">{Math.round(details.ownership)}/100</span>
                </div>
              )}
              {details.controlRisk !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-[color:var(--color-text-secondary)]">Control Risk</span>
                  <span className="font-semibold text-white">{Math.round(details.controlRisk)}/100</span>
                </div>
              )}
              {details.liquidity !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-[color:var(--color-text-secondary)]">Liquidity</span>
                  <span className="font-semibold text-white">{Math.round(details.liquidity)}/100</span>
                </div>
              )}
              {details.governance !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-[color:var(--color-text-secondary)]">Governance</span>
                  <span className="font-semibold text-white">{Math.round(details.governance)}/100</span>
                </div>
              )}
              {details.gini !== undefined && (
                <div className="flex items-center justify-between border-t border-white/5 pt-2">
                  <span className="text-[color:var(--color-text-secondary)]">Gini Coefficient</span>
                  <span className="font-mono text-white">{details.gini.toFixed(2)}</span>
                </div>
              )}
              {details.hhi !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-[color:var(--color-text-secondary)]">HHI</span>
                  <span className="font-mono text-white">{details.hhi.toFixed(2)}</span>
                </div>
              )}
              {details.nakamoto !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-[color:var(--color-text-secondary)]">Nakamoto Coeff.</span>
                  <span className="font-mono text-white">{details.nakamoto}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
          Benchmark
        </p>
        <p className="text-sm font-semibold" style={{ color: tone.color }}>
          {tone.label}
        </p>
      </div>
    </div>
  );
}

