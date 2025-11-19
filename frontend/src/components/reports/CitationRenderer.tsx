"use client";

import React, { ReactNode } from "react";
import { AiSectionSource } from "@/types/token";

type Props = {
    content: string;
    sources: AiSectionSource[];
};

export default function CitationRenderer({ content, sources }: Props) {
    const nodes: ReactNode[] = [];
    if (!content) return null;

    const sourceMap = new Map<number, AiSectionSource>(sources.map((source) => [source.id, source]));
    const citationRegex = /\[(\d+)\]/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = citationRegex.exec(content)) !== null) {
        const index = match.index;
        if (index > lastIndex) {
            nodes.push(content.slice(lastIndex, index));
        }
        const citationId = Number(match[1]);
        const source = sourceMap.get(citationId);
        nodes.push(<CitationSup key={`cite-${index}-${citationId}`} number={citationId} source={source} />);
        lastIndex = citationRegex.lastIndex;
    }

    if (lastIndex < content.length) {
        nodes.push(content.slice(lastIndex));
    }

    return <>{nodes}</>;
}

function CitationSup({ number, source }: { number: number; source?: AiSectionSource }) {
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (source?.url) {
            window.open(source.url, "_blank", "noopener,noreferrer");
        }
    };

    return (
        <sup className="group relative mx-0.5">
            <button
                onClick={handleClick}
                className="cursor-pointer text-[#8ee3ff] transition-all hover:text-[#3fe081] hover:underline focus:outline-none focus:ring-1 focus:ring-[#8ee3ff]/50 rounded-sm px-0.5"
                title={source?.title || source?.url || `Citation ${number}`}
                type="button"
            >
                [{number}]
            </button>
            {source && (
                <span className="pointer-events-none absolute left-1/2 bottom-full mb-2 z-20 hidden w-64 -translate-x-1/2 rounded-lg border border-white/20 bg-black/95 p-3 text-[10px] leading-snug text-white shadow-2xl group-hover:block backdrop-blur-sm">
                    <span className="block font-semibold text-[11px] text-white mb-1">
                        {source.title ?? source.url}
                    </span>
                    {source.snippet && <span className="block text-white/70 mb-1">{source.snippet}</span>}
                    <span className="block truncate text-[#8ee3ff] text-[9px]">{source.url}</span>
                    <span className="block mt-1 text-[9px] text-white/40 italic">Click to open</span>
                </span>
            )}
        </sup>
    );
}
