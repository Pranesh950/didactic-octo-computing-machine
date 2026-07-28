import { useState, useCallback, useRef } from "react";
import {
  FileText,
  Loader2,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  TrendingUp,
  Users,
  AlertTriangle,
  Target,
  ThumbsUp,
  ArrowRight,
  Search,
  Building2,
} from "lucide-react";
import Badge from "@/components/shared/Badge";
import { cn } from "@/lib/utils";
import { startups } from "@/data/mock";
import { runAgentStream } from "@/lib/backend-client";

const sectionIcons: Record<string, React.ReactNode> = {
  "Executive Summary": <FileText className="w-3.5 h-3.5 text-accent-400" />,
  "Market Analysis": <TrendingUp className="w-3.5 h-3.5 text-accent-400" />,
  "Team Assessment": <Users className="w-3.5 h-3.5 text-accent-400" />,
  "Investment Thesis": <Target className="w-3.5 h-3.5 text-accent-400" />,
  "Risk Analysis": <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
  Recommendation: <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />,
};

export default function Briefing() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [intent, setIntent] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState("");
  const [subAgents, setSubAgents] = useState<string[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedCompany = startups.find((s) => s.id === selectedCompanyId);

  const filteredCompanies = startups.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleGenerate = useCallback(async () => {
    if (!selectedCompany || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setResponseText("");
    setStreamingContent("");
    setIntent(null);
    setModelUsed("");
    setSubAgents([]);

    try {
      // Streaming call — the backend runs LangGraph and streams the result
      const result = await runAgentStream(
        `Generate a detailed investment memo for ${selectedCompany.name}.`,
        selectedCompany.id,
        {
          onToken: (token) => {
            setStreamingContent((prev) => prev + token);
            scrollRef.current?.scrollTo({
              top: scrollRef.current.scrollHeight,
              behavior: "smooth",
            });
          },
          onComplete: (final) => {
            setIntent(final.intent);
            setModelUsed(final.model_used);
            setSubAgents(final.sub_agents);
          },
          onError: (errMsg) => {
            setError(errMsg);
          },
        },
      );
      setResponseText(result.response);
      setModelUsed(result.model_used);
      setSubAgents(result.sub_agents);
      setIntent(result.intent);
      setStreamingContent("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to generate briefing";
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  }, [selectedCompany, isGenerating]);

  // Parse sections from the response
  const sections = responseText
    .split(/(?=## )/)
    .filter(Boolean)
    .map((s) => {
      const lines = s.trim().split("\n");
      const heading = lines[0].replace(/^##\s*/, "").trim();
      const content = lines.slice(1).join("\n").trim();
      return { heading, content };
    });

  return (
    <div className="flex h-full">
      {/* Left: Config / Controls */}
      <div className="w-80 flex-shrink-0 border-r border-gray-800 bg-[#0b0c0e] flex flex-col">
        <div className="px-5 py-3.5 border-b border-gray-800">
          <div className="flex items-center gap-2.5 mb-1">
            <FileText className="w-4 h-4 text-accent-400" />
            <h2 className="text-[15px] font-semibold text-gray-0">Briefing</h2>
            <div className="flex items-center gap-1 ml-2">
              <Sparkles className="w-3 h-3 text-accent-400" />
              <span className="text-[10px] text-accent-400 font-mono">LangGraph</span>
            </div>
          </div>
          <p className="text-[12px] text-gray-500 font-mono">
            AI investment memo
          </p>
        </div>

        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* Company Selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider font-mono">
              Select Company
            </label>
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-950 border border-gray-800 rounded-md text-[13px] text-gray-200 hover:border-gray-700 transition-colors focus:border-gray-600 focus:ring-2 focus:ring-accent-500/10 font-mono"
              >
                {selectedCompany ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-accent-500/20 border border-accent-500/30 flex items-center justify-center text-[8px] font-bold text-accent-400">
                      {selectedCompany.logo}
                    </span>
                    {selectedCompany.name}
                  </span>
                ) : (
                  <span className="text-gray-600">Choose a startup...</span>
                )}
                <ChevronDown
                  className={cn(
                    "w-3.5 h-3.5 text-gray-500 transition-transform",
                    showDropdown && "rotate-180",
                  )}
                />
              </button>

              {showDropdown && (
                <div className="absolute top-full mt-1 w-full bg-gray-950 border border-gray-800 rounded-md shadow-lg z-50 overflow-hidden animate-fade-in">
                  <div className="p-2 border-b border-gray-800">
                    <div className="relative">
                      <Search className="w-3 h-3 text-gray-600 absolute left-2 top-1/2 -translate-y-1/2" />
                      <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Filter companies..."
                        className="w-full pl-7 pr-2.5 py-1.5 bg-gray-900 border border-gray-800 rounded text-[11px] text-gray-200 placeholder:text-gray-600 focus:border-gray-600 font-mono"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredCompanies.length === 0 ? (
                      <p className="px-3 py-4 text-[11px] text-gray-600 text-center font-mono">
                        No companies found
                      </p>
                    ) : (
                      filteredCompanies.map((company) => (
                        <button
                          key={company.id}
                          onClick={() => {
                            setSelectedCompanyId(company.id);
                            setShowDropdown(false);
                            setSearchQuery("");
                            setResponseText("");
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2.5 text-[12px] transition-colors hover:bg-gray-900 flex items-center gap-2.5",
                            company.id === selectedCompanyId &&
                              "bg-accent-500/10 border-l-2 border-accent-500",
                          )}
                        >
                          <span className="w-4 h-4 rounded bg-accent-500/20 border border-accent-500/30 flex items-center justify-center text-[7px] font-bold text-accent-400 flex-shrink-0">
                            {company.logo}
                          </span>
                          <span className="flex-1 text-gray-200 font-mono">
                            {company.name}
                          </span>
                          <Badge variant="neutral">{company.stage}</Badge>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Company preview */}
          {selectedCompany && (
            <div className="bg-gray-950 border border-gray-800 rounded-lg p-3.5 space-y-2 animate-fade-in">
              <div className="flex items-center gap-2">
                <Building2 className="w-3 h-3 text-gray-500" />
                <span className="text-[11px] font-medium text-gray-300">
                  {selectedCompany.name}
                </span>
                <Badge
                  variant={
                    selectedCompany.growthSignal === "high"
                      ? "success"
                      : selectedCompany.growthSignal === "medium"
                        ? "warning"
                        : "neutral"
                  }
                >{`${selectedCompany.growthSignal} signal`}</Badge>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                {selectedCompany.description}
              </p>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div>
                  <span className="text-gray-600">Industry</span>
                  <p className="text-gray-400">{selectedCompany.industry}</p>
                </div>
                <div>
                  <span className="text-gray-600">Founded</span>
                  <p className="text-gray-400">{selectedCompany.founded}</p>
                </div>
                <div>
                  <span className="text-gray-600">Total Funding</span>
                  <p className="text-gray-400">
                    ${(selectedCompany.totalFunding / 1_000_000).toFixed(0)}M
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Employees</span>
                  <p className="text-gray-400">
                    {selectedCompany.employeeCount}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!selectedCompany || isGenerating}
            className={cn(
              "w-full py-2.5 rounded-md text-[13px] font-semibold transition-all flex items-center justify-center gap-2 font-mono",
              selectedCompany && !isGenerating
                ? "bg-accent-500 text-white hover:bg-accent-600"
                : "bg-gray-900 text-gray-600 cursor-not-allowed border border-gray-800",
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Generate Memo
              </>
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 animate-fade-in">
              <p className="text-[11px] text-red-400 font-mono">{error}</p>
              <p className="text-[10px] text-gray-600 mt-1 font-mono">
                Ensure backend is running on port 8000
              </p>
            </div>
          )}

          {/* Agent info */}
          {(modelUsed || subAgents.length > 0) && (
            <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 animate-fade-in space-y-2">
              {modelUsed && (
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-mono mb-0.5">
                    Model
                  </p>
                  <p className="text-[11px] text-gray-400 font-mono truncate">
                    {modelUsed}
                  </p>
                </div>
              )}
              {subAgents.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-mono mb-0.5">
                    Agents
                  </p>
                  {subAgents.map((a) => (
                    <div key={a} className="text-[10px] text-gray-400 font-mono flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-accent-400" />
                      {a}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Memo output */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0d0e10]">
        <div className="px-5 py-3.5 border-b border-gray-800 bg-[#0b0c0e] flex items-center justify-between">
          <div>
            <h3 className="text-[13px] font-semibold text-gray-200">
              {responseText
                ? `Investment Memo: ${selectedCompany?.name ?? ""}`
                : selectedCompany
                  ? `Memo: ${selectedCompany.name}`
                  : "Investment Memo"}
            </h3>
            {responseText && (
              <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                {sections.length} sections • AI-generated via LangGraph
              </p>
            )}
          </div>
          {isGenerating && (
            <div className="flex items-center gap-2 text-[11px] text-accent-400 font-mono">
              <Loader2 className="w-3 h-3 animate-spin" />
              Writing...
            </div>
          )}
          {responseText && !isGenerating && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
              <CheckCircle2 className="w-3 h-3" />
              Complete
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto" ref={scrollRef}>
          {/* Empty state */}
          {!selectedCompany && !responseText && !isGenerating && (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-12 h-12 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mb-4">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
              <h3 className="text-[14px] font-semibold text-gray-400 mb-1">
                Investment Memo
              </h3>
              <p className="text-[12px] text-gray-600 max-w-xs font-mono leading-relaxed">
                Select a company from the left panel and generate a
                comprehensive AI-powered investment memo via LangGraph agents.
              </p>
            </div>
          )}

          {/* Waiting for generation */}
          {selectedCompany && !responseText && !isGenerating && (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-12 h-12 rounded-full bg-accent-500/10 border border-accent-500/20 flex items-center justify-center mb-4">
                <ArrowRight className="w-5 h-5 text-accent-400" />
              </div>
              <h3 className="text-[14px] font-semibold text-gray-300 mb-1">
                Ready to analyze {selectedCompany.name}
              </h3>
              <p className="text-[12px] text-gray-500 font-mono">
                Click "Generate Memo" to run the LangGraph briefing agent
              </p>
            </div>
          )}

          {/* Streaming preview */}
          {isGenerating && streamingContent && (
            <div className="p-6">
              <div className="text-[13px] text-gray-300 font-mono whitespace-pre-wrap leading-relaxed animate-fade-in">
                {streamingContent}
              </div>
            </div>
          )}

          {/* Completed memo */}
          {responseText && !isGenerating && (
            <div className="p-6 space-y-4 animate-fade-in">
              {/* Recommendation banner */}
              {sections
                .filter((s) => s.heading.toLowerCase().includes("recommend"))
                .map((section, i) => {
                  const content = section.content.toLowerCase();
                  const isHold = content.includes("hold");
                  const isBuy = !isHold && content.includes("buy");
                  const isStrong = content.includes("strong");
                  const isPass = content.includes("pass");
                  const color = isStrong || isBuy
                    ? "emerald" : isHold ? "amber" : isPass ? "red" : "gray";

                  return (
                    <div
                      key={i}
                      className={cn(
                        "rounded-lg p-4 border",
                        color === "emerald" && "bg-emerald-500/5 border-emerald-500/20",
                        color === "amber" && "bg-amber-500/5 border-amber-500/20",
                        color === "red" && "bg-red-500/5 border-red-500/20",
                        color === "gray" && "bg-gray-900 border-gray-800",
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {sectionIcons["Recommendation"]}
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider font-mono">
                          Recommendation
                        </span>
                      </div>
                      <p className={cn(
                        "text-[14px] leading-relaxed font-medium",
                        color === "emerald" && "text-emerald-400",
                        color === "amber" && "text-amber-400",
                        color === "red" && "text-red-400",
                        color === "gray" && "text-gray-300",
                      )}>
                        {section.content}
                      </p>
                    </div>
                  );
                })}

              {/* Standard sections */}
              {sections
                .filter((s) => !s.heading.toLowerCase().includes("recommend"))
                .map((section, i) => (
                  <div
                    key={i}
                    className="bg-gray-950 border border-gray-800 rounded-lg overflow-hidden"
                  >
                    <div className="px-4 py-2.5 border-b border-gray-800 bg-gray-900/50 flex items-center gap-2">
                      {sectionIcons[section.heading] || (
                        <FileText className="w-3.5 h-3.5 text-accent-400" />
                      )}
                      <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider font-mono">
                        {section.heading}
                      </h4>
                    </div>
                    <div className="p-4">
                      <p className="text-[13px] text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {section.content || (
                          <span className="text-gray-600 italic">
                            No content generated for this section.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}

              {/* Raw response toggle */}
              <details className="group mt-2">
                <summary className="text-[11px] text-gray-600 font-mono cursor-pointer hover:text-gray-400 transition-colors inline-flex items-center gap-1.5">
                  <FileText className="w-3 h-3" />
                  View raw response
                </summary>
                <pre className="mt-2 p-3 bg-gray-950 border border-gray-800 rounded-lg text-[11px] text-gray-400 font-mono whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                  {responseText}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
