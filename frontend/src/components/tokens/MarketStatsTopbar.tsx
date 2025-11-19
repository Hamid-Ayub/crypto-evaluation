"use client";

import { useState } from "react";
import { RefreshCw, TrendingUp, TrendingDown, BarChart3, Coins } from "lucide-react";
import { formatUsd } from "@/lib/api";
import { refreshMarketData } from "@/lib/api";

type Props = {
    tokenId: string;
    symbol: string;
    price?: number;
    priceChange24h?: number;
    volume24h?: number;
    marketCap?: number;
};

export default function MarketStatsTopbar({
    tokenId,
    symbol,
    price,
    priceChange24h,
    volume24h,
    marketCap,
}: Props) {
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        try {
            setIsRefreshing(true);
            await refreshMarketData(tokenId);
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            console.error("Refresh error:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const isPositive = (priceChange24h || 0) >= 0;

    return (
        <div className="fixed top-6 left-1/2 z-50 -translate-x-1/2">
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/80 px-4 py-2 shadow-2xl backdrop-blur-xl transition-all hover:border-white/20 hover:bg-black/90">
                {/* Token Info */}
                <div className="flex items-center gap-3">
                    <span className="font-bold text-white">{symbol}</span>
                    {price !== undefined && (
                        <span className="font-mono font-medium text-white/90">
                            {formatUsd(price)}
                        </span>
                    )}
                </div>

                {/* 24h Change */}
                {priceChange24h !== undefined && (
                    <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${isPositive
                        ? "bg-[#3fe081]/10 text-[#3fe081]"
                        : "bg-[#ff4d4d]/10 text-[#ff4d4d]"
                        }`}>
                        {isPositive ? (
                            <TrendingUp className="h-3 w-3" />
                        ) : (
                            <TrendingDown className="h-3 w-3" />
                        )}
                        {Math.abs(priceChange24h).toFixed(2)}%
                    </div>
                )}

                {/* Stats Divider */}
                <div className="h-4 w-px bg-white/10" />

                {/* Market Stats */}
                <div className="flex items-center gap-4">
                    {/* Volume */}
                    {volume24h !== undefined && (
                        <div className="flex items-center gap-1.5 text-xs text-white/60" title="24h Volume">
                            <BarChart3 className="h-3.5 w-3.5" />
                            <span className="font-mono">{formatUsd(volume24h, { notation: "compact" })}</span>
                        </div>
                    )}

                    {/* Market Cap */}
                    {marketCap !== undefined && (
                        <div className="flex items-center gap-1.5 text-xs text-white/60" title="Market Cap">
                            <Coins className="h-3.5 w-3.5" />
                            <span className="font-mono">{formatUsd(marketCap, { notation: "compact" })}</span>
                        </div>
                    )}
                </div>

                {/* Action Divider */}
                <div className="h-4 w-px bg-white/10" />

                {/* Refresh Button */}
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="group flex items-center justify-center rounded-full p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    title="Refresh Data"
                >
                    <RefreshCw className={`h-3.5 w-3.5 transition-transform ${isRefreshing ? "animate-spin" : "group-hover:rotate-180"}`} />
                </button>
            </div>
        </div>
    );
}
