import { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Search,
  Trash2,
  Clock,
  Bot,
  Briefcase,
  BarChart3,
  Target,
  Copy,
  CheckCircle2,
  ChevronRight,
  FolderOpen,
  Sparkles,
} from "lucide-react";
import Badge from "@/components/shared/Badge";
import { cn } from "@/lib/utils";
import {
  deleteFile,
  subscribeToFiles,
  seedWorkspace,
  type WorkspaceFile,
} from "@/data/workspace";
import { useAuth } from "@/contexts/AuthContext";

const typeConfig: Record<
  WorkspaceFile["type"],
  { icon: React.FC<{ className?: string }>; label: string; color: string; bg: string }
> = {
  research_report: {
    icon: BarChart3,
    label: "Research Reports",
    color: "text-accent-400",
    bg: "bg-accent-500/10 border-accent-500/20",
  },
  investment_memo: {
    icon: Target,
    label: "Investment Memos",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  briefing: {
    icon: Briefcase,
    label: "Briefings",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  company_analysis: {
    icon: BarChart3,
    label: "Company Analyses",
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
  },
};

const agentBadge: Record<WorkspaceFile["createdBy"], { label: string; variant: "info" | "success" }> = {
  scout: { label: "Scout", variant: "info" },
  briefing: { label: "Briefing", variant: "success" },
};

// ── Helpers ──────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

function previewText(content: string, maxLen = 80): string {
  const firstLine = content.split("\n")[0]?.replace(/^#+\s*/, "")?.trim() ?? "";
  if (firstLine.length > maxLen) return firstLine.slice(0, maxLen) + "…";
  return firstLine || "No content";
}

// ── Component ────────────────────────────────────────────

export default function Research() {
  const { user } = useAuth();
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  // Subscribe to real-time Firestore changes + seed on first load
  useEffect(() => {
    if (!user) return;
    seedWorkspace(user.uid);
    const unsub = subscribeToFiles(user.uid, setFiles);
    return unsub;
  }, [user]);

  const selected = useMemo(
    () => files.find((f) => f.id === selectedId) ?? null,
    [files, selectedId],
  );

  const filesByType = useMemo(() => {
    const filtered = searchQuery
      ? files.filter(
          (f) =>
            f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.content.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : files;
    const groups: Record<string, WorkspaceFile[]> = {
      research_report: [],
      investment_memo: [],
      briefing: [],
      company_analysis: [],
    };
    for (const f of filtered) {
      groups[f.type]?.push(f);
    }
    return groups;
  }, [files, searchQuery]);

  const handleDelete = (id: string) => {
    if (!user) return;
    if (selectedId === id) setSelectedId(null);
    deleteFile(user.uid, id);
  };

  const handleCopy = () => {
    if (!selected) return;
    navigator.clipboard.writeText(selected.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const sectionTypes: WorkspaceFile["type"][] = [
    "research_report",
    "investment_memo",
    "briefing",
    "company_analysis",
  ];

  return (
    <div className="flex h-full">
      {/* ── Left Sidebar: File list (Notion-style) ── */}
      <div className="w-72 flex-shrink-0 border-r border-gray-800 bg-[#0b0c0e] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <FolderOpen className="w-4 h-4 text-accent-400" />
            <h2 className="text-[15px] font-semibold text-gray-0">Workspace</h2>
          </div>
          <p className="text-[11px] text-gray-500 font-mono">
            {files.length} file{files.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-gray-800">
          <div className="relative">
            <Search className="w-3 h-3 text-gray-600 absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files…"
              className="w-full pl-7 pr-2.5 py-1.5 bg-gray-950 border border-gray-800 rounded text-[11px] text-gray-200 placeholder:text-gray-600 focus:border-gray-600 font-mono"
            />
          </div>
        </div>

        {/* File tree (grouped by type) */}
        <div className="flex-1 overflow-y-auto py-1.5">
          {sectionTypes.map((type) => {
            const typeFiles = filesByType[type];
            if (typeFiles.length === 0) return null;

            const cfg = typeConfig[type];
            const Icon = cfg.icon;

            return (
              <div key={type} className="mb-1">
                <div className="px-4 py-1.5 flex items-center gap-1.5">
                  <Icon className="w-3 h-3 text-gray-600 flex-shrink-0" />
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider font-mono">
                    {cfg.label}
                  </span>
                  <span className="text-[9px] text-gray-700 font-mono ml-auto">
                    {typeFiles.length}
                  </span>
                </div>
                {typeFiles.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => setSelectedId(file.id)}
                    className={cn(
                      "w-full text-left px-4 py-2 mx-1.5 rounded-md transition-all duration-75 group/file",
                      selectedId === file.id
                        ? "bg-gray-800 text-gray-0"
                        : "text-gray-400 hover:text-gray-200 hover:bg-gray-900/70",
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <FileText
                        className={cn(
                          "w-3.5 h-3.5 mt-0.5 flex-shrink-0",
                          selectedId === file.id ? "text-accent-400" : "text-gray-600 group-hover/file:text-gray-400",
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-medium truncate">{file.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-gray-600 font-mono flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {formatDate(file.createdAt)}
                          </span>
                          <span className="text-[10px] text-gray-600 font-mono">
                            {previewText(file.content, 40)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            );
          })}

          {/* Empty state */}
          {files.length === 0 && (
            <div className="px-4 py-8 text-center">
              <FileText className="w-6 h-6 text-gray-700 mx-auto mb-2" />
              <p className="text-[12px] text-gray-500 font-mono">No files yet</p>
              <p className="text-[10px] text-gray-700 mt-0.5 font-mono">
                Agent output auto-saves here
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: File viewer ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0d0e10]">
        {selected ? (
          <>
            {/* File header */}
            <div className="px-5 py-3.5 border-b border-gray-800 bg-[#0b0c0e]">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5",
                      typeConfig[selected.type].bg,
                    )}
                  >
                    {(() => {
                      const Icon = typeConfig[selected.type].icon;
                      return <Icon className={cn("w-3.5 h-3.5", typeConfig[selected.type].color)} />;
                    })()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-semibold text-gray-0 truncate">
                      {selected.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="neutral">{typeConfig[selected.type].label}</Badge>
                      <Badge variant={agentBadge[selected.createdBy].variant}>
                        {agentBadge[selected.createdBy].label}
                      </Badge>
                      {selected.companyName && (
                        <span className="text-[11px] text-gray-500 font-mono">
                          {selected.companyName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0 ml-4">
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors"
                    title={copied ? "Copied!" : "Copy content"}
                  >
                    {copied ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(selected.id)}
                    className="p-1.5 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
                    title="Delete file"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Meta bar */}
              <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-800 text-[10px] text-gray-600 font-mono">
                <span className="flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {new Date(selected.createdAt).toLocaleString()}
                </span>
                {selected.modelUsed && (
                  <span className="flex items-center gap-1">
                    <Bot className="w-2.5 h-2.5" />
                    {selected.modelUsed}
                  </span>
                )}
                {selected.sourceQuery && (
                  <span className="flex items-center gap-1 truncate max-w-[200px]">
                    <Sparkles className="w-2.5 h-2.5 flex-shrink-0" />
                    <span className="truncate">{selected.sourceQuery}</span>
                  </span>
                )}
              </div>
            </div>

            {/* File content (markdown rendered as sections) */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-3xl">
                <FileContent content={selected.content} />
              </div>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-12 h-12 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mb-4">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
            <h3 className="text-[14px] font-semibold text-gray-400 mb-1">
              Workspace
            </h3>
            <p className="text-[12px] text-gray-600 max-w-xs font-mono leading-relaxed">
              {files.length === 0
                ? "Agent output from Scout and Briefing auto-saves here. Ask Scout a research question to get started."
                : "Select a file from the sidebar to view its contents"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── File Content Renderer ────────────────────────────────

function FileContent({ content }: { content: string }) {
  // Split into sections by ## headers
  const sections = content
    .split(/(?=## )/)
    .filter(Boolean)
    .map((s) => {
      const lines = s.trim().split("\n");
      const heading = lines[0].replace(/^##\s*/, "").trim();
      const body = lines.slice(1).join("\n").trim();
      return { heading, body };
    });

  if (sections.length === 0) {
    return (
      <div className="bg-gray-950 border border-gray-800 rounded-lg p-5">
        <p className="text-[13px] text-gray-300 leading-relaxed whitespace-pre-wrap font-mono">
          {content}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sections.map((section, i) => {
        const isRec = section.heading.toLowerCase().includes("recommend");
        const recColor = isRec
          ? section.body.toLowerCase().includes("pass")
            ? "red"
            : section.body.toLowerCase().includes("hold")
              ? "amber"
              : "emerald"
          : null;

        return (
          <div
            key={i}
            className={cn(
              "bg-gray-950 border rounded-lg overflow-hidden",
              recColor === "emerald" && "border-emerald-500/20 bg-emerald-500/5",
              recColor === "amber" && "border-amber-500/20 bg-amber-500/5",
              recColor === "red" && "border-red-500/20 bg-red-500/5",
              !recColor && "border-gray-800",
            )}
          >
            <div className="px-4 py-2.5 border-b border-gray-800 bg-gray-900/50 flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-gray-600" />
              <h4
                className={cn(
                  "text-[11px] font-semibold uppercase tracking-wider font-mono",
                  recColor === "emerald" && "text-emerald-400",
                  recColor === "amber" && "text-amber-400",
                  recColor === "red" && "text-red-400",
                  !recColor && "text-gray-400",
                )}
              >
                {section.heading}
              </h4>
            </div>
            <div className="p-4">
              <p
                className={cn(
                  "text-[13px] leading-relaxed whitespace-pre-wrap font-mono",
                  recColor === "emerald" && "text-emerald-300",
                  recColor === "amber" && "text-amber-300",
                  recColor === "red" && "text-red-300",
                  !recColor && "text-gray-300",
                )}
              >
                {section.body || (
                  <span className="text-gray-600 italic">No content</span>
                )}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
