"use client";

import { Map, CheckCircle2, Clock, Calendar } from "lucide-react";

export type RoadmapData = {
  completed?: Array<{
    milestone: string;
    date?: string;
    description?: string;
  }>;
  upcoming?: Array<{
    milestone: string;
    targetDate?: string;
    description?: string;
  }>;
};

type Props = {
  roadmap?: RoadmapData;
};

export default function RoadmapDisplay({ roadmap }: Props) {
  if (!roadmap || (!roadmap.completed?.length && !roadmap.upcoming?.length)) {
    return (
      <div className="rounded-lg border border-dashed border-white/20 bg-white/[0.01] p-4 text-xs text-[color:var(--color-text-muted)]">
        <p>Roadmap information will be parsed from project websites and documentation when available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Completed Milestones */}
      {roadmap.completed && roadmap.completed.length > 0 && (
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <CheckCircle2 className="h-4 w-4 text-[#3fe081]" />
            Completed Milestones
          </h4>
          <div className="space-y-3">
            {roadmap.completed.map((item, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-[#3fe081]/20 bg-[#3fe081]/5 p-4"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#3fe081] mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-semibold text-white">{item.milestone}</h5>
                      {item.date && (
                        <span className="text-xs text-[color:var(--color-text-muted)] flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {item.date}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="mt-2 text-xs leading-relaxed text-[color:var(--color-text-secondary)]">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Milestones */}
      {roadmap.upcoming && roadmap.upcoming.length > 0 && (
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <Clock className="h-4 w-4 text-[#f7c548]" />
            Upcoming Milestones
          </h4>
          <div className="space-y-3">
            {roadmap.upcoming.map((item, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-[#f7c548]/20 bg-[#f7c548]/5 p-4"
              >
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-[#f7c548] mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-semibold text-white">{item.milestone}</h5>
                      {item.targetDate && (
                        <span className="text-xs text-[color:var(--color-text-muted)] flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {item.targetDate}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="mt-2 text-xs leading-relaxed text-[color:var(--color-text-secondary)]">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

