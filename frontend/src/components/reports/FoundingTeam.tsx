"use client";

import { Users, User, Briefcase, Building2, ExternalLink, Linkedin, Twitter } from "lucide-react";

export type FoundingTeamData = {
  members?: Array<{
    name: string;
    role?: string;
    bio?: string;
    linkedin?: string;
    twitter?: string;
  }>;
  advisors?: Array<{
    name: string;
    role?: string;
    bio?: string;
  }>;
  organization?: {
    entityType?: string;
    jurisdiction?: string;
    structure?: string;
  };
};

type Props = {
  teamData?: FoundingTeamData;
};

export default function FoundingTeam({ teamData }: Props) {
  if (!teamData || (!teamData.members?.length && !teamData.advisors?.length && !teamData.organization)) {
    return (
      <div className="rounded-lg border border-dashed border-white/20 bg-white/[0.01] p-4 text-xs text-[color:var(--color-text-muted)]">
        <p>Team information will be parsed from project websites and public sources when available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Members */}
      {teamData.members && teamData.members.length > 0 && (
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <Users className="h-4 w-4 text-[#8ee3ff]" />
            Key Team Members
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {teamData.members.map((member, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-white/10 bg-white/[0.02] p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-[color:var(--color-text-muted)]" />
                      <h5 className="font-semibold text-white">{member.name}</h5>
                    </div>
                    {member.role && (
                      <p className="mt-1 text-xs text-[color:var(--color-text-secondary)] flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {member.role}
                      </p>
                    )}
                    {member.bio && (
                      <p className="mt-2 text-xs leading-relaxed text-[color:var(--color-text-secondary)]">
                        {member.bio}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {member.linkedin && (
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[color:var(--color-text-muted)] hover:text-[#8ee3ff] transition"
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                    {member.twitter && (
                      <a
                        href={member.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[color:var(--color-text-muted)] hover:text-[#8ee3ff] transition"
                      >
                        <Twitter className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advisors */}
      {teamData.advisors && teamData.advisors.length > 0 && (
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <Users className="h-4 w-4 text-[#f7c548]" />
            Advisors
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {teamData.advisors.map((advisor, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-white/10 bg-white/[0.02] p-4"
              >
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-[color:var(--color-text-muted)] mt-0.5" />
                  <div className="flex-1">
                    <h5 className="font-semibold text-white">{advisor.name}</h5>
                    {advisor.role && (
                      <p className="mt-1 text-xs text-[color:var(--color-text-secondary)]">
                        {advisor.role}
                      </p>
                    )}
                    {advisor.bio && (
                      <p className="mt-2 text-xs leading-relaxed text-[color:var(--color-text-secondary)]">
                        {advisor.bio}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Organization */}
      {teamData.organization && (
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <Building2 className="h-4 w-4 text-[#c784ff]" />
            Organization Structure
          </h4>
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 space-y-2">
            {teamData.organization.entityType && (
              <div>
                <span className="text-xs text-[color:var(--color-text-muted)]">Entity Type: </span>
                <span className="text-xs text-white">{teamData.organization.entityType}</span>
              </div>
            )}
            {teamData.organization.jurisdiction && (
              <div>
                <span className="text-xs text-[color:var(--color-text-muted)]">Jurisdiction: </span>
                <span className="text-xs text-white">{teamData.organization.jurisdiction}</span>
              </div>
            )}
            {teamData.organization.structure && (
              <div>
                <span className="text-xs text-[color:var(--color-text-muted)]">Structure: </span>
                <span className="text-xs text-white">{teamData.organization.structure}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

