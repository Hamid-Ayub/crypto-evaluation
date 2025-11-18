"use client";

import { ExternalLink, Globe, FileText, Github, Twitter, MessageCircle, Send, BookOpen, Link as LinkIcon } from "lucide-react";

export type ProjectLinksData = {
  website?: string;
  documentation?: string[];
  whitepaper?: string;
  tokenomics?: string;
  github?: string[];
  twitter?: string;
  discord?: string;
  telegram?: string;
  medium?: string;
  blog?: string;
  other?: Array<{ label: string; url: string }>;
};

type Props = {
  links?: ProjectLinksData;
  projectProfile?: {
    website?: string;
    docs?: string;
    twitter?: string;
    discord?: string;
    telegram?: string;
    githubRepos?: string[];
  };
};

export default function ProjectLinks({ links, projectProfile }: Props) {
  // Merge links from both sources
  const mergedLinks: ProjectLinksData = {
    website: links?.website || projectProfile?.website,
    documentation: links?.documentation || (projectProfile?.docs ? [projectProfile.docs] : undefined),
    github: links?.github || projectProfile?.githubRepos,
    twitter: links?.twitter || projectProfile?.twitter,
    discord: links?.discord || projectProfile?.discord,
    telegram: links?.telegram || projectProfile?.telegram,
    whitepaper: links?.whitepaper,
    tokenomics: links?.tokenomics,
    medium: links?.medium,
    blog: links?.blog,
    other: links?.other,
  };

  const hasLinks = Object.values(mergedLinks).some(
    (value) => value && (Array.isArray(value) ? value.length > 0 : true),
  );

  if (!hasLinks) {
    return (
      <div className="rounded-lg border border-dashed border-white/20 bg-white/[0.01] p-4 text-xs text-[color:var(--color-text-muted)]">
        <p>No project links available. Links can be parsed from project websites and documentation.</p>
      </div>
    );
  }

  const LinkItem = ({ icon: Icon, label, url }: { icon: any; label: string; url: string }) => (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-[color:var(--color-text-secondary)] transition hover:border-[#8ee3ff]/40 hover:bg-[#8ee3ff]/10 hover:text-[#8ee3ff]"
    >
      <Icon className="h-4 w-4" />
      <span className="flex-1">{label}</span>
      <ExternalLink className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
    </a>
  );

  return (
    <div className="space-y-3">
      {mergedLinks.website && (
        <LinkItem icon={Globe} label="Website" url={mergedLinks.website} />
      )}

      {mergedLinks.documentation && mergedLinks.documentation.length > 0 && (
        <div className="space-y-2">
          {mergedLinks.documentation.map((doc, idx) => (
            <LinkItem key={idx} icon={FileText} label={`Documentation${mergedLinks.documentation!.length > 1 ? ` ${idx + 1}` : ""}`} url={doc} />
          ))}
        </div>
      )}

      {mergedLinks.whitepaper && (
        <LinkItem icon={BookOpen} label="Whitepaper" url={mergedLinks.whitepaper} />
      )}

      {mergedLinks.tokenomics && (
        <LinkItem icon={FileText} label="Tokenomics Document" url={mergedLinks.tokenomics} />
      )}

      {mergedLinks.github && mergedLinks.github.length > 0 && (
        <div className="space-y-2">
          {mergedLinks.github.map((repo, idx) => (
            <LinkItem key={idx} icon={Github} label={`GitHub${mergedLinks.github!.length > 1 ? ` ${idx + 1}` : ""}`} url={repo} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {mergedLinks.twitter && (
          <LinkItem icon={Twitter} label="Twitter" url={mergedLinks.twitter} />
        )}
        {mergedLinks.discord && (
          <LinkItem icon={MessageCircle} label="Discord" url={mergedLinks.discord} />
        )}
        {mergedLinks.telegram && (
          <LinkItem icon={Send} label="Telegram" url={mergedLinks.telegram} />
        )}
        {mergedLinks.medium && (
          <LinkItem icon={FileText} label="Medium" url={mergedLinks.medium} />
        )}
        {mergedLinks.blog && (
          <LinkItem icon={FileText} label="Blog" url={mergedLinks.blog} />
        )}
      </div>

      {mergedLinks.other && mergedLinks.other.length > 0 && (
        <div className="space-y-2">
          {mergedLinks.other.map((item, idx) => (
            <LinkItem key={idx} icon={LinkIcon} label={item.label} url={item.url} />
          ))}
        </div>
      )}
    </div>
  );
}

