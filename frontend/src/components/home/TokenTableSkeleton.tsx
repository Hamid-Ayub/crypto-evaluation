import React from "react";

export default function TokenTableSkeleton() {
    return (
        <div className="rounded-[24px] border border-white/5 bg-black/10">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] border-separate border-spacing-0 text-sm">
                    <thead>
                        <tr className="text-left text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
                            {["Asset", "Contract", "Benchmark", "Holders", "Risk", "Updated", ""].map((header, i) => (
                                <th key={i} className="border-b border-white/5 px-6 py-4">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {[...Array(5)].map((_, i) => (
                            <tr key={i} className="border-b border-white/[0.06]">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 animate-pulse rounded-full bg-white/5" />
                                        <div className="space-y-2">
                                            <div className="h-4 w-24 animate-pulse rounded bg-white/5" />
                                            <div className="h-3 w-16 animate-pulse rounded bg-white/5" />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="h-6 w-24 animate-pulse rounded-full bg-white/5" />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="h-8 w-16 animate-pulse rounded bg-white/5" />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="h-5 w-20 animate-pulse rounded bg-white/5" />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="h-6 w-24 animate-pulse rounded-full bg-white/5" />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="h-4 w-24 animate-pulse rounded bg-white/5" />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="h-8 w-24 animate-pulse rounded-full bg-white/5" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-white/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="h-4 w-48 animate-pulse rounded bg-white/5" />
                <div className="flex gap-2">
                    <div className="h-6 w-16 animate-pulse rounded-full bg-white/5" />
                    <div className="h-6 w-24 animate-pulse rounded bg-white/5" />
                    <div className="h-6 w-16 animate-pulse rounded-full bg-white/5" />
                </div>
            </div>
        </div>
    );
}
