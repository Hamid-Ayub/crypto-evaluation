"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen w-full bg-black flex items-center justify-center p-4">
            <div className="max-w-md w-full rounded-[32px] border border-white/10 bg-[#0a0a0f] p-8 text-center">
                <div className="flex justify-center mb-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                        <AlertTriangle className="h-8 w-8 text-red-500" />
                    </div>
                </div>

                <h2 className="mb-2 text-2xl font-bold text-white">Unable to load token</h2>
                <p className="mb-8 text-white/60">
                    We encountered an error while fetching the token data. This might be due to a network issue or the token ID being invalid.
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => reset()}
                        className="flex items-center justify-center gap-2 rounded-xl bg-white text-black px-4 py-3 text-sm font-bold hover:bg-white/90 transition"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Try again
                    </button>

                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white hover:bg-white/10 transition"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to benchmarks
                    </Link>
                </div>
            </div>
        </div>
    );
}
