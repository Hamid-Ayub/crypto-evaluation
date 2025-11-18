import { TokenRecord } from "@/types/token";
import { Target, Users, Map, Link as LinkIcon } from "lucide-react";
import AiContentBlock from "@/components/reports/AiContentBlock";
import { getAiSectionLengthHint } from "@/lib/aiSectionMeta";
import FoundingTeam, { FoundingTeamData } from "./FoundingTeam";
import RoadmapDisplay, { RoadmapData } from "./RoadmapDisplay";
import ProjectLinks, { ProjectLinksData } from "./ProjectLinks";

type Props = {
  token: TokenRecord;
  parsedProjectData?: {
    foundingTeam?: FoundingTeamData;
    roadmap?: RoadmapData;
    links?: ProjectLinksData;
    tokenomics?: any;
  };
};

export default function ProjectOverview({ token, parsedProjectData }: Props) {
  const overviewLengthHint = getAiSectionLengthHint("projectOverview");
  return (
    <section className="card-sheen rounded-[28px] border border-white/5 bg-[color:var(--color-bg-card)] p-6 lg:p-8">
      <div className="mb-6 flex items-center gap-3">
        <Target className="h-6 w-6 text-[#3fe081]" />
        <div>
          <h2 className="text-2xl font-semibold text-white">2. Project Overview</h2>
          <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
            Mission, vision, team, and roadmap information
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Mission & Vision */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-[#8ee3ff]" />
            <h3 className="text-lg font-semibold text-white">2.1 Mission & Vision</h3>
          </div>
          <AiContentBlock
            tokenId={token.id}
            sectionId="projectOverview"
            initialContent={token.aiSections?.projectOverview?.content ?? ""}
            initialModel={token.aiSections?.projectOverview?.model}
            initialUpdatedAt={token.aiSections?.projectOverview?.updatedAt}
            initialSources={token.aiSections?.projectOverview?.sources}
            helperText={`${overviewLengthHint} Gemini summarizes mission, token utility, and roadmap narrative using the latest research.`}
          />
        </div>

        {/* Founding Team & Organization */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-[#f7c548]" />
            <h3 className="text-lg font-semibold text-white">2.2 Founding Team & Organization</h3>
          </div>
          <FoundingTeam teamData={parsedProjectData?.foundingTeam} />
        </div>

        {/* Roadmap */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <div className="mb-4 flex items-center gap-2">
            <Map className="h-5 w-5 text-[#c784ff]" />
            <h3 className="text-lg font-semibold text-white">2.3 Roadmap</h3>
          </div>
          <RoadmapDisplay roadmap={parsedProjectData?.roadmap} />
        </div>

        {/* Project Links */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <div className="mb-4 flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-[#8ee3ff]" />
            <h3 className="text-lg font-semibold text-white">2.4 Project Links & Resources</h3>
          </div>
          <ProjectLinks links={parsedProjectData?.links} projectProfile={token.projectProfile} />
        </div>
      </div>
    </section>
  );
}

