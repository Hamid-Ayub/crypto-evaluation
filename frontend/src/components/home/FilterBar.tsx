import { ChangeEvent } from "react";
import { Download, Filter, Search } from "lucide-react";

export type FilterState = {
  chain: string;
  risk: string;
  category: string;
  query: string;
  sort: "score" | "liquidity" | "alphabetical" | "holders" | "volume" | "risk" | "updated";
  sortDir: "asc" | "desc";
  view: "table" | "grid";
};

type Props = {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onExport: () => void;
  total: number;
};

const chainOptions = [
  { label: "All chains", value: "all" },
  { label: "Ethereum", value: "eip155:1" },
  { label: "Arbitrum", value: "eip155:42161" },
  { label: "Base", value: "eip155:8453" },
  { label: "Solana", value: "eip155:501" },
  { label: "Avalanche", value: "eip155:43114" },
];

const categoryOptions = [
  { label: "All categories", value: "all" },
  { label: "DeFi", value: "defi" },
  { label: "Infrastructure", value: "infrastructure" },
  { label: "Layer 2", value: "l2" },
  { label: "Gaming", value: "gaming" },
  { label: "Stablecoins", value: "stablecoin" },
];

const riskOptions = [
  { label: "All risk", value: "all" },
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

const sortOptions = [
  { label: "Benchmark score", value: "score" },
  { label: "Liquidity depth", value: "liquidity" },
  { label: "Alphabetical", value: "alphabetical" },
];

const viewOptions: Array<{ label: string; value: FilterState["view"] }> = [
  { label: "Table", value: "table" },
  { label: "Grid", value: "grid" },
];

export default function FilterBar({ filters, onChange, onExport, total }: Props) {
  const update = (patch: Partial<FilterState>) => {
    onChange({ ...filters, ...patch });
  };

  const handleSelect =
    (name: keyof FilterState) => (event: ChangeEvent<HTMLSelectElement>) => {
      update({ [name]: event.target.value } as Partial<FilterState>);
    };

  const appliedFilters = [
    filters.chain !== "all",
    filters.category !== "all",
    filters.risk !== "all",
    Boolean(filters.query.trim()),
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-4 rounded-[24px] border border-white/5 bg-white/[0.02] p-5">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
          Search universe
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-[color:var(--color-text-muted)]" />
          <input
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-11 py-3 text-sm text-white outline-none focus:border-white/40"
            placeholder="Try “EigenLayer”, “0xabc…”, or “Restaking”"
            value={filters.query}
            onChange={(event) => update({ query: event.target.value })}
          />
          <span className="pointer-events-none absolute right-4 top-3 text-[11px] uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
            {total} matches • {appliedFilters} filter
            {appliedFilters === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {[{ options: chainOptions, name: "chain" }, { options: categoryOptions, name: "category" }, { options: riskOptions, name: "risk" }].map((config) => (
          <select
            key={config.name}
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-white/40"
            value={filters[config.name as keyof FilterState] as string}
            onChange={handleSelect(config.name as keyof FilterState)}
          >
            {config.options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                className="bg-[color:var(--color-bg-card)] text-black"
              >
                {option.label}
              </option>
            ))}
          </select>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
          Quick risk lenses
        </p>
        <div className="flex flex-wrap gap-2">
          {["low", "medium", "high"].map((risk) => {
            const active = filters.risk === risk;
            return (
              <button
                key={risk}
                type="button"
                onClick={() => update({ risk: active ? "all" : (risk as FilterState["risk"]) })}
                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${
                  active
                    ? "bg-[#3fe081]/20 text-[#3fe081] border border-[#3fe081]/40"
                    : "border border-white/10 text-[color:var(--color-text-secondary)] hover:border-white/30"
                }`}
              >
                {risk}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
              Sort by
            </label>
            <select
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-xs text-white outline-none focus:border-white/40"
              value={filters.sort}
              onChange={handleSelect("sort")}
            >
              {sortOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="bg-[color:var(--color-bg-card)] text-black"
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
              View
            </label>
            <div className="flex rounded-full border border-white/10 p-1">
              {viewOptions.map((option) => {
                const active = filters.view === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => update({ view: option.value })}
                    className={`rounded-full px-4 py-1 text-xs font-semibold transition ${
                      active
                        ? "bg-white text-black"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex flex-shrink-0 flex-wrap gap-3">
          <button
            className="flex items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40"
            type="button"
          >
            <Filter className="h-4 w-4" />
            Advanced filters
          </button>
          <button
            onClick={onExport}
            type="button"
            className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#3fe081] to-[#8ee3ff] px-5 py-3 text-sm font-semibold text-black transition hover:brightness-110"
          >
            <Download className="h-4 w-4" />
            Generate CSV
          </button>
        </div>
      </div>
    </div>
  );
}

