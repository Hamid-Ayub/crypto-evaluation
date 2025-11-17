"use client";

import { useEffect, useState } from "react";
import HeroSection from "./HeroSection";
import OverviewCards from "./OverviewCards";
import FilterBar, { FilterState } from "./FilterBar";
import TokenTable from "./TokenTable";
import { TokenRecord } from "@/types/token";
import { ScoreLookupResult, fetchTokens, TokenListResponse } from "@/lib/api";

const PAGE_SIZE = 5;

export default function HomePage() {
  const [filters, setFilters] = useState<FilterState>({
    chain: "all",
    risk: "all",
    category: "all",
    query: "",
    sort: "score",
    sortDir: "desc",
    view: "table",
  });
  const [page, setPage] = useState(1);
  const [lastLookup, setLastLookup] = useState<ScoreLookupResult | null>(null);
  const [data, setData] = useState<TokenListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTokens = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchTokens({
          chain: filters.chain,
          category: filters.category,
          risk: filters.risk,
          query: filters.query,
          sort: filters.sort,
          sortDir: filters.sortDir,
          page,
          pageSize: PAGE_SIZE,
        });
        setData(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tokens");
        console.error("Failed to fetch tokens:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTokens();
  }, [filters, page]);

  const handleFiltersChange = (nextFilters: FilterState) => {
    setFilters(nextFilters);
    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    if (data) {
      setPage(Math.min(Math.max(1, nextPage), data.pagination.totalPages));
    }
  };

  const handleLookupSuccess = (result: ScoreLookupResult) => {
    setLastLookup(result);
  };

  const handleExport = () => {
    if (!data?.items) return;
    
    const header = [
      "Name",
      "Symbol",
      "Chain",
      "Address",
      "Benchmark Score",
      "Gini",
      "HHI",
      "Nakamoto",
    ];
    const rows = data.items.map((token) => [
      token.name,
      token.symbol,
      token.chainLabel,
      token.address,
      token.benchmarkScore.toString(),
      token.benchmarkDetails.gini.toString(),
      token.benchmarkDetails.hhi.toString(),
      token.benchmarkDetails.nakamoto.toString(),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `token-report-${Date.now()}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const tokens = data?.items ?? [];
  const allTokensForOverview = data?.summary.topLiquidity ?? tokens;
  const totalItems = data?.pagination.totalItems ?? 0;
  const totalPages = data?.pagination.totalPages ?? 1;

  return (
    <div className="min-h-screen w-full pb-16 pt-10 text-[color:var(--color-text-primary)]">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 sm:px-8 lg:px-12">
        <HeroSection onLookupSuccess={handleLookupSuccess} lastLookup={lastLookup} />
        <OverviewCards tokens={allTokensForOverview} lastLookup={lastLookup} />
        <section className="space-y-4 rounded-[28px] border border-white/5 bg-[color:var(--color-bg-card)] p-2 sm:p-4 lg:p-6">
          <FilterBar
            filters={filters}
            onChange={handleFiltersChange}
            onExport={handleExport}
            total={totalItems}
          />
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-sm text-[color:var(--color-text-secondary)]">Loading tokens...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-sm text-[#ff8a5c]">{error}</div>
            </div>
          ) : (
            <TokenTable
              tokens={tokens}
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={PAGE_SIZE}
              onPageChange={handlePageChange}
              view={filters.view}
              sort={filters.sort}
              sortDir={filters.sortDir}
              onSortChange={(sort, sortDir) => {
                setFilters({ ...filters, sort: sort as FilterState["sort"], sortDir });
                setPage(1);
              }}
            />
          )}
        </section>
      </main>
    </div>
  );
}

