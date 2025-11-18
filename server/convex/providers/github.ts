import fetch, { HeadersInit } from "cross-fetch";

const GITHUB_BASE = process.env.GITHUB_API_URL ?? "https://api.github.com";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";

type GitHubRepoResponse = {
  full_name: string;
  description?: string;
  homepage?: string;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  subscribers_count?: number;
  open_issues_count: number;
  default_branch: string;
  language?: string;
  topics?: string[];
  license?: { spdx_id?: string; name?: string };
  owner: { login: string; html_url: string };
  html_url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
};

type GitHubCommitActivityWeek = {
  total: number;
  week: number;
};

type GitHubCommitResponse = Array<{
  commit: {
    author?: { date?: string };
    committer?: { date?: string };
  };
  sha: string;
}>;

type GitHubReleaseResponse = {
  tag_name?: string;
  published_at?: string;
};

export type GitHubRepoStats = {
  repo: string;
  repoUrl: string;
  owner: string;
  name: string;
  description?: string;
  homepage?: string;
  license?: string;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  subscribers?: number;
  defaultBranch?: string;
  primaryLanguage?: string;
  topics?: string[];
  commitsLast4Weeks?: number;
  commitsThisYear?: number;
  avgWeeklyCommits?: number;
  contributorsCount?: number;
  lastCommitAt?: number;
  lastReleaseAt?: number;
  lastReleaseTag?: string;
  fetchedAt: number;
  source: "github";
};

type RepoIdentity = { owner: string; repo: string };

function parseRepoInput(input: string): RepoIdentity {
  const cleaned = input.trim();
  if (!cleaned) {
    throw new Error("github-invalid-repo");
  }

  if (cleaned.startsWith("git@github.com:")) {
    const [owner, repo] = cleaned.replace("git@github.com:", "").replace(".git", "").split("/");
    if (!owner || !repo) throw new Error("github-invalid-repo");
    return { owner, repo };
  }

  if (cleaned.startsWith("http")) {
    const url = new URL(cleaned);
    const segments = url.pathname.replace(/^\/+/, "").replace(/\.git$/, "").split("/");
    if (segments.length < 2) throw new Error("github-invalid-repo");
    return { owner: segments[0], repo: segments[1] };
  }

  const parts = cleaned.replace(".git", "").split("/");
  if (parts.length === 2) {
    return { owner: parts[0], repo: parts[1] };
  }

  throw new Error("github-invalid-repo");
}

async function githubRequest<T>(
  path: string,
  options?: RequestInit & { allow202?: boolean },
): Promise<{ data: T | null; headers: HeadersInit; status: number }> {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "User-Agent": "crypto-evaluation-research-bot",
  };
  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }

  const response = await fetch(`${GITHUB_BASE}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options?.headers ?? {}),
    },
  });

  if (response.status === 202 && options?.allow202) {
    return { data: null, headers: response.headers, status: response.status };
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`github-${response.status}: ${body || response.statusText}`);
  }

  const data = (await response.json()) as T;
  return { data, headers: response.headers, status: response.status };
}

async function fetchCommitActivity(owner: string, repo: string): Promise<GitHubCommitActivityWeek[] | null> {
  // GitHub may return 202 while computing stats - retry a couple of times
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, status } = await githubRequest<GitHubCommitActivityWeek[]>(
      `/repos/${owner}/${repo}/stats/commit_activity`,
      { allow202: true },
    );
    if (status === 202) {
      await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
      continue;
    }
    return data;
  }
  return null;
}

async function fetchLatestCommit(owner: string, repo: string, branch: string): Promise<number | undefined> {
  const { data } = await githubRequest<GitHubCommitResponse>(
    `/repos/${owner}/${repo}/commits?per_page=1&sha=${branch}`,
  );
  const entry = data?.[0];
  const iso = entry?.commit?.committer?.date ?? entry?.commit?.author?.date;
  return iso ? new Date(iso).getTime() : undefined;
}

async function fetchLatestRelease(owner: string, repo: string): Promise<{ tag?: string; published?: number } | null> {
  try {
    const { data } = await githubRequest<GitHubReleaseResponse>(`/repos/${owner}/${repo}/releases/latest`);
    if (!data) return null;
    return {
      tag: data.tag_name ?? undefined,
      published: data.published_at ? new Date(data.published_at).getTime() : undefined,
    };
  } catch (error: any) {
    if ((error?.message ?? "").includes("404")) {
      return null;
    }
    throw error;
  }
}

function parseContributorsCount(linkHeader: string | null, perPage: number): number | undefined {
  if (!linkHeader) return undefined;
  const match = linkHeader.match(/&page=(\d+)>;\s*rel="last"/);
  if (!match) return undefined;
  const lastPage = Number(match[1]);
  if (!Number.isFinite(lastPage)) return undefined;
  return lastPage * perPage;
}

async function fetchContributorsCount(owner: string, repo: string): Promise<number | undefined> {
  const perPage = 1;
  const response = await fetch(`${GITHUB_BASE}/repos/${owner}/${repo}/contributors?per_page=${perPage}&anon=1`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "crypto-evaluation-research-bot",
      ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
    },
  });
  if (!response.ok) {
    if (response.status === 404) return undefined;
    const body = await response.text().catch(() => "");
    throw new Error(`github-${response.status}: ${body || response.statusText}`);
  }
  const linkHeader = response.headers.get("link");
  const countFromLink = parseContributorsCount(linkHeader, perPage);
  if (countFromLink) return countFromLink;
  const contributors = (await response.json()) as Array<unknown>;
  return contributors.length;
}

export async function getGitHubStats(repoInput: string): Promise<GitHubRepoStats> {
  const { owner, repo } = parseRepoInput(repoInput);
  const { data: repoData } = await githubRequest<GitHubRepoResponse>(`/repos/${owner}/${repo}`);

  if (!repoData) {
    throw new Error("github-repo-missing");
  }

  const defaultBranch = repoData.default_branch || "main";
  const [commitActivity, latestRelease, contributorsCount, lastCommitAt] = await Promise.all([
    fetchCommitActivity(owner, repo),
    fetchLatestRelease(owner, repo),
    fetchContributorsCount(owner, repo),
    fetchLatestCommit(owner, repo, defaultBranch),
  ]);

  let latestCommitTimestamp = lastCommitAt;
  if (!latestCommitTimestamp && defaultBranch) {
    latestCommitTimestamp = await fetchLatestCommit(owner, repo, defaultBranch);
  }

  let commitsLast4Weeks: number | undefined;
  let commitsThisYear: number | undefined;
  let avgWeeklyCommits: number | undefined;

  if (commitActivity && commitActivity.length > 0) {
    const recentWeeks = commitActivity.slice(-4);
    commitsLast4Weeks = recentWeeks.reduce((sum, entry) => sum + (entry?.total ?? 0), 0);
    commitsThisYear = commitActivity.reduce((sum, entry) => sum + (entry?.total ?? 0), 0);
    avgWeeklyCommits = Number((commitsThisYear / commitActivity.length).toFixed(1));
  }

  return {
    repo: repoData.full_name,
    repoUrl: repoData.html_url,
    owner: repoData.owner.login,
    name: repoData.full_name.split("/")[1] ?? repoData.full_name,
    description: repoData.description,
    homepage: repoData.homepage,
    license: repoData.license?.spdx_id ?? repoData.license?.name,
    stars: repoData.stargazers_count,
    forks: repoData.forks_count,
    watchers: repoData.watchers_count,
    openIssues: repoData.open_issues_count,
    subscribers: repoData.subscribers_count,
    defaultBranch: repoData.default_branch,
    primaryLanguage: repoData.language,
    topics: repoData.topics,
    commitsLast4Weeks,
    commitsThisYear,
    avgWeeklyCommits,
    contributorsCount,
    lastCommitAt: latestCommitTimestamp,
    lastReleaseAt: latestRelease?.published,
    lastReleaseTag: latestRelease?.tag,
    fetchedAt: Date.now(),
    source: "github",
  };
}


