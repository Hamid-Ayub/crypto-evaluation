import clsx from "clsx";

type Props = {
  data: number[];
  className?: string;
  gradientId?: string;
  height?: number;
};

export default function Sparkline({
  data,
  className,
  gradientId,
  height = 80,
}: Props) {
  if (data.length === 0) {
    return null;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const computedId = gradientId ?? `sparkline-${Math.abs(min) + Math.abs(max)}`;
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1 || 1)) * 100;
      const y = max === min ? 50 : ((max - value) / (max - min)) * 60 + 10;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 80" className={clsx("w-full", className)} style={{ height }}>
      <defs>
        <linearGradient id={computedId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3fe081" />
          <stop offset="100%" stopColor="#c784ff" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={`url(#${computedId})`}
        strokeWidth="3"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}



