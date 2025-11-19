import { query } from "./_generated/server";

// Analyze jobs table
export const analyzeJobs = query({
    args: {},
    handler: async (ctx) => {
        const allJobs = await ctx.db.query("jobs").collect();

        const byStatus = allJobs.reduce((acc, job) => {
            acc[job.status] = (acc[job.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const errors = allJobs.filter(j => j.status === "error");
        const errorTypes = errors.reduce((acc, job) => {
            const errorMsg = job.error || "unknown";
            acc[errorMsg] = (acc[errorMsg] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            total: allJobs.length,
            byStatus,
            errorCount: errors.length,
            errorTypes,
            sampleErrors: errors.slice(0, 5).map(e => ({
                id: e._id,
                type: e.type,
                error: e.error,
                createdAt: new Date(e.createdAt).toISOString(),
            })),
        };
    },
});

// Analyze assets table
export const analyzeAssets = query({
    args: {},
    handler: async (ctx) => {
        const allAssets = await ctx.db.query("assets").collect();

        const byStatus = allAssets.reduce((acc, asset) => {
            acc[asset.status] = (acc[asset.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const byChain = allAssets.reduce((acc, asset) => {
            acc[asset.chainId] = (acc[asset.chainId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const incomplete = allAssets.filter(a =>
            a.status === "pending" || !a.symbol || !a.name
        );

        return {
            total: allAssets.length,
            byStatus,
            byChain,
            incompleteCount: incomplete.length,
            sampleIncomplete: incomplete.slice(0, 5).map(a => ({
                id: a._id,
                chainId: a.chainId,
                address: a.address,
                symbol: a.symbol,
                name: a.name,
                status: a.status,
            })),
        };
    },
});

// Analyze all tables
export const analyzeAllTables = query({
    args: {},
    handler: async (ctx) => {
        const tables = [
            "assets", "contracts", "holders_snapshot", "market_data",
            "liquidity", "governance", "audits", "project_profiles",
            "chain_stats", "jobs", "rate_limits", "ai_reports",
            "refresh_locks", "refresh_history"
        ];

        const counts: Record<string, number> = {};

        for (const table of tables) {
            try {
                const docs = await ctx.db.query(table as any).collect();
                counts[table] = docs.length;
            } catch (e) {
                counts[table] = -1; // Error querying
            }
        }

        return counts;
    },
});
