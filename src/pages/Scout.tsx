import { useState, useCallback, useRef, useEffect } from "react";
import {
  CheckCircle2,
  Loader2,
  Crosshair,
  FileText,
  PanelRightClose,
  User,
  Bot,
  Copy,
  Sparkles,
  ArrowUp,
  ChevronRight,
  Zap,
  Brain,
  Search,
  BarChart3,
  FileSearch,
  Clock,
  Library,
  ArrowLeft,
  MessageSquare,
  FileSpreadsheet,
} from "lucide-react";
import Badge from "@/components/shared/Badge";
import { cn } from "@/lib/utils";
import { runAgentStream } from "@/lib/backend-client";
import { addFile, subscribeToFiles } from "@/data/workspace";
import type { WorkspaceFile } from "@/data/workspace";
import { useAuth } from "@/contexts/AuthContext";

type StepStatus = "pending" | "running" | "complete";

interface AgentStep {
  id: string;
  label: string;
  icon: React.ElementType;
  status: StepStatus;
}

const defaultSteps: AgentStep[] = [
  { id: "routing", label: "Analyzing intent and routing to specialists", icon: Brain, status: "pending" },
  { id: "researching", label: "Searching across startup database", icon: Search, status: "pending" },
  { id: "analyzing", label: "Evaluating companies and market dynamics", icon: BarChart3, status: "pending" },
  { id: "synthesizing", label: "Synthesizing insights into findings", icon: FileSearch, status: "pending" },
];

interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  sourceQuery?: string;
  timestamp: string;
  savedToWorkspace?: boolean;
  reportFileId?: string;
}

const suggestions = [
  {
    title: "AI Robotics",
    query: "Find promising AI robotics startups founded by researchers from top labs",
    gradient: "from-violet-500/20 to-purple-600/10",
    icon: Zap,
  },
  {
    title: "Synthetic Biology",
    query: "Map the synthetic biology landscape for companies using generative AI",
    gradient: "from-emerald-500/20 to-teal-600/10",
    icon: Sparkles,
  },
  {
    title: "Climate Tech",
    query: "Identify early-stage climate tech startups with strong technical moats",
    gradient: "from-sky-500/20 to-blue-600/10",
    icon: Search,
  },
  {
    title: "Agent Infrastructure",
    query: "Find AI agent companies building autonomous workflow infrastructure",
    gradient: "from-amber-500/20 to-orange-600/10",
    icon: Brain,
  },
];

// ── Mode Toggle ───────────────────────────────────────

function ModeToggle({
  mode,
  onChange,
}: {
  mode: "quick" | "research";
  onChange: (m: "quick" | "research") => void;
}) {
  return (
    <div className="flex items-center bg-gray-900/60 border border-gray-800 rounded-lg p-0.5">
      <button
        onClick={() => onChange("quick")}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all",
          mode === "quick"
            ? "bg-gray-800 text-gray-200 shadow-sm"
            : "text-gray-500 hover:text-gray-300",
        )}
        title="Quick conversational answer"
      >
        <MessageSquare className="w-3 h-3" />
        Quick
      </button>
      <button
        onClick={() => onChange("research")}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all",
          mode === "research"
            ? "bg-accent-500/20 text-accent-400 shadow-sm"
            : "text-gray-500 hover:text-gray-300",
        )}
        title="Full research report"
      >
        <FileSpreadsheet className="w-3 h-3" />
        Report
      </button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────

export default function Scout() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<AgentStep[]>(defaultSteps);
  const [liveContent, setLiveContent] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [savedFileId, setSavedFileId] = useState<string | null>(null);
  const [mode, setMode] = useState<"quick" | "research">("quick");
  const [panelTab, setPanelTab] = useState<"library" | "pipeline">("library");
  const [reports, setReports] = useState<WorkspaceFile[]>([]);
  const [selectedReport, setSelectedReport] = useState<WorkspaceFile | null>(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const workspaceScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Subscribe to real-time report updates
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToFiles(user.uid, (files) => {
      setReports(files.filter((f) => f.createdBy === "scout"));
    });
    return unsub;
  }, [user]);

  // Auto-switch to pipeline when running
  useEffect(() => {
    if (isRunning) setPanelTab("pipeline");
  }, [isRunning]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, liveContent]);

  useEffect(() => {
    if (liveContent && workspaceScrollRef.current) {
      workspaceScrollRef.current.scrollTop = workspaceScrollRef.current.scrollHeight;
    }
  }, [liveContent]);

  const handleRun = useCallback(async () => {
    if (!query.trim() || isRunning) return;

    const currentQuery = query;
    const currentMode = mode;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: currentQuery,
      sourceQuery: currentQuery,
      timestamp: new Date().toISOString(),
    };

    setIsRunning(true);
    setError(null);
    setLiveContent("");
    setSavedFileId(null);
    setSelectedReport(null);
    setPanelTab("pipeline");
    setMessages((prev) => [...prev, userMsg]);
    setSteps(defaultSteps.map((s) => ({ ...s, status: "pending" as StepStatus })));
    setQuery("");

    setSteps((prev) =>
      prev.map((s) => (s.id === "routing" ? { ...s, status: "running" } : s)),
    );

    let tokenCount = 0;
    const completedSteps = new Set<string>();

    const advanceStep = (stepId: string) => {
      if (completedSteps.has(stepId)) return;
      completedSteps.add(stepId);
      setSteps((prev) =>
        prev.map((s) => {
          if (s.id === stepId) return { ...s, status: "complete" as StepStatus };
          const allIds = defaultSteps.map((ds) => ds.id);
          const stepIdx = allIds.indexOf(stepId);
          const currIdx = allIds.indexOf(s.id);
          if (currIdx === stepIdx + 1) return { ...s, status: "running" as StepStatus };
          return s;
        }),
      );
    };

    try {
      await runAgentStream(currentQuery, undefined, {
        onToken: (token) => {
          setLiveContent((prev) => prev + token);
          tokenCount++;
          if (tokenCount > 3) advanceStep("routing");
          if (tokenCount > 20) advanceStep("researching");
          if (tokenCount > 60) advanceStep("analyzing");
          if (tokenCount > 120) advanceStep("synthesizing");
        },
        onComplete: async (final) => {
          const finalContent = liveContent || final.response;

          const agentMsg: ChatMessage = {
            id: `msg-${Date.now()}-agent`,
            role: "agent",
            content: finalContent,
            sourceQuery: currentQuery,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, agentMsg]);
          setSteps((prev) => prev.map((s) => ({ ...s, status: "complete" as StepStatus })));

          // Auto-save for research mode
          if (currentMode === "research") {
            const file = await addFile(user!.uid, {
              title: currentQuery.slice(0, 60) + (currentQuery.length > 60 ? "…" : ""),
              type: "research_report",
              content: finalContent,
              createdBy: "scout",
              sourceQuery: currentQuery,
              modelUsed: final.model_used,
            });
            if (file) {
              setSavedFileId(file.id);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === agentMsg.id ? { ...m, savedToWorkspace: true, reportFileId: file.id } : m,
                ),
              );
            }
          }
        },
        onError: (errMsg) => {
          setError(errMsg);
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Research failed";
      setError(message);
      setSteps((prev) =>
        prev.map((s) =>
          s.status === "running" ? { ...s, status: "pending" as StepStatus } : s,
        ),
      );
    } finally {
      setIsRunning(false);
    }
  }, [query, isRunning, user, mode]);

  const handleCreateReport = useCallback(
    async (msg: ChatMessage) => {
      if (msg.savedToWorkspace || !user || reportSubmitting) return;
      setReportSubmitting(true);
      try {
        const file = await addFile(user.uid, {
          title: (msg.sourceQuery || "Research").slice(0, 60) + ((msg.sourceQuery || "").length > 60 ? "…" : ""),
          type: "research_report",
          content: msg.content,
          createdBy: "scout",
          sourceQuery: msg.sourceQuery,
        });
        if (file) {
          setSavedFileId(file.id);
          setSelectedReport(file);
          setPanelTab("library");
          setMessages((prev) =>
            prev.map((m) => (m.id === msg.id ? { ...m, savedToWorkspace: true, reportFileId: file.id } : m)),
          );
        }
      } finally {
        setReportSubmitting(false);
      }
    },
    [user, reportSubmitting],
  );

  const handleFollowUp = useCallback((report: WorkspaceFile) => {
    setQuery(`Regarding "${report.title.replace(/…$/, "")}": `);
    setSelectedReport(null);
    setPanelTab("library");
    inputRef.current?.focus();
  }, []);

  const hasConversation = messages.length > 0 || isRunning;

  return (
    <div className="flex h-full relative">
      {/* ── Main Chat Panel ── */}
      <div className={cn(
        "flex flex-col min-w-0 bg-gray-1000 transition-all duration-300",
        workspaceOpen ? "flex-1 mr-[420px]" : "flex-1",
      )}>
        {/* Header bar */}
        <div className="px-6 py-3.5 border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-500/20 to-violet-500/10 border border-accent-500/20 flex items-center justify-center">
              <Crosshair className="w-4 h-4 text-accent-400" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-gray-0 leading-tight">Scout</h2>
              <p className="text-[11px] text-gray-500 font-medium">AI-powered startup research</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {reports.length > 0 && (
              <button
                onClick={() => { setWorkspaceOpen(true); setPanelTab("library"); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-gray-400 hover:text-gray-200 hover:bg-gray-800/70 transition-all font-medium"
              >
                <Library className="w-3.5 h-3.5" />
                Library
                <span className="w-4 h-4 rounded-full bg-accent-500/20 border border-accent-500/30 text-[9px] font-bold text-accent-400 flex items-center justify-center">
                  {reports.length}
                </span>
              </button>
            )}
            {hasConversation && !workspaceOpen && (
              <button
                onClick={() => setWorkspaceOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-gray-400 hover:text-gray-200 hover:bg-gray-800/70 transition-all font-medium"
              >
                <FileText className="w-3.5 h-3.5" />
                Research panel
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto">
          {/* ── Empty State ── */}
          {!hasConversation && (
            <div className="flex flex-col items-center justify-center h-full px-6 py-12">
              <div className="text-center max-w-2xl mx-auto animate-fade-in">
                <div className="relative mb-8">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-accent-500/15 via-violet-500/10 to-accent-500/5 border border-accent-500/15 flex items-center justify-center shadow-lg shadow-accent-500/5">
                    <Crosshair className="w-9 h-9 text-accent-400" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                </div>

                <h1 className="text-2xl font-bold text-gray-0 mb-2 tracking-tight">
                  Research any market,
                </h1>
                <p className="text-lg text-gray-400 leading-relaxed mb-1">
                  discover startups, and surface investment opportunities
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Scout orchestrates specialized AI agents to research, analyze, and synthesize insights from across the startup ecosystem.
                </p>
              </div>

              {/* Suggestion cards */}
              <div className="mt-10 w-full max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: "0.1s" }}>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3 text-center">
                  Try asking about
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {suggestions.map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          setQuery(s.query);
                          inputRef.current?.focus();
                        }}
                        className="group relative text-left p-4 rounded-xl border border-gray-800/60 bg-gray-900/40 hover:bg-gray-900/80 hover:border-gray-700/60 transition-all duration-200 overflow-hidden"
                      >
                        <div className={cn(
                          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br",
                          s.gradient,
                        )} />
                        <div className="relative z-10 flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-accent-500/10 border border-accent-500/15 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                            <Icon className="w-3.5 h-3.5 text-accent-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-gray-200 mb-0.5">{s.title}</p>
                            <p className="text-[12px] text-gray-500 leading-relaxed line-clamp-2">{s.query}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick input (centered) */}
              <div className="mt-10 w-full max-w-xl mx-auto animate-slide-up" style={{ animationDelay: "0.2s" }}>
                <div className="flex items-center justify-center mb-2">
                  <ModeToggle mode={mode} onChange={setMode} />
                </div>
                <div className="relative">
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRun()}
                    placeholder={mode === "research"
                      ? "Ask for a full research report..."
                      : "Ask Scout anything about startups, markets, or trends..."}
                    className="w-full pl-5 pr-14 py-3.5 bg-gray-900/60 border border-gray-800/60 rounded-2xl text-[14px] text-gray-0 placeholder:text-gray-600 focus:outline-none focus:border-accent-500/40 focus:bg-gray-900/90 transition-all duration-200 shadow-sm"
                  />
                  <button
                    onClick={handleRun}
                    disabled={!query.trim()}
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200",
                      query.trim()
                        ? "bg-white text-gray-0 hover:bg-gray-100 hover:scale-[1.04] active:scale-[0.97]"
                        : "bg-gray-800 text-gray-600",
                    )}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Conversation ── */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "px-6 py-5 transition-colors duration-150",
                msg.role === "agent" ? "bg-gray-950/30" : "",
              )}
            >
              <div className="max-w-[720px] mx-auto flex items-start gap-4">
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                  msg.role === "user"
                    ? "bg-gradient-to-br from-accent-500/20 to-accent-500/10 border border-accent-500/20"
                    : "bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 border border-emerald-500/20",
                )}>
                  {msg.role === "user"
                    ? <User className="w-3.5 h-3.5 text-accent-400" />
                    : <Bot className="w-3.5 h-3.5 text-emerald-400" />
                  }
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={cn(
                      "text-[12px] font-semibold",
                      msg.role === "user" ? "text-gray-400" : "text-emerald-400",
                    )}>
                      {msg.role === "user" ? "You" : "Scout"}
                    </span>
                    <span className="text-[11px] text-gray-600">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <div className="text-[14px] text-gray-300 leading-[1.7] whitespace-pre-wrap">
                    {msg.content}
                  </div>

                  {/* Agent action bar */}
                  {msg.role === "agent" && (
                    <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-800/50">
                      {msg.savedToWorkspace ? (
                        <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3" />
                          Saved to library
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleCreateReport(msg)}
                            disabled={reportSubmitting}
                            className={cn(
                              "text-[11px] font-medium flex items-center gap-1.5 transition-colors px-2.5 py-1 rounded-md border",
                              reportSubmitting
                                ? "text-gray-600 border-gray-800 cursor-not-allowed"
                                : "text-accent-400 border-accent-500/20 bg-accent-500/5 hover:bg-accent-500/10 hover:border-accent-500/30",
                            )}
                          >
                            {reportSubmitting ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <FileSpreadsheet className="w-3 h-3" />
                            )}
                            Create Research Report
                          </button>
                          <button
                            onClick={() => navigator.clipboard.writeText(msg.content)}
                            className="text-[11px] text-gray-500 hover:text-gray-400 font-medium flex items-center gap-1.5 transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                            Copy
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setWorkspaceOpen(!workspaceOpen)}
                        className="text-[11px] text-gray-500 hover:text-gray-400 font-medium flex items-center gap-1.5 transition-colors ml-auto"
                      >
                        <FileText className="w-3 h-3" />
                        Research panel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* ── Streaming Response ── */}
          {isRunning && (
            <div className="px-6 py-5 bg-gray-950/30">
              <div className="max-w-[720px] mx-auto flex items-start gap-4">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 relative">
                  <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[12px] font-semibold text-emerald-400">Scout</span>
                    {liveContent ? (
                      <span className="text-[11px] text-emerald-400/60 animate-pulse">generating…</span>
                    ) : (
                      <DotPulse />
                    )}
                  </div>

                  {liveContent ? (
                    <div className="text-[14px] text-gray-300 leading-[1.7] whitespace-pre-wrap">
                      {liveContent}
                      <span className="inline-block w-1.5 h-4 bg-emerald-400/80 ml-0.5 align-middle animate-pulse rounded-sm" />
                    </div>
                  ) : (
                    <div className="text-[13px] text-gray-500 italic">Analyzing your query…</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <div className="px-6 py-4">
              <div className="max-w-[720px] mx-auto bg-red-500/5 border border-red-500/15 rounded-xl p-4">
                <p className="text-[13px] text-red-400 font-medium">{error}</p>
                <p className="text-[12px] text-gray-600 mt-1.5">
                  Ensure the backend is running:{" "}
                  <code className="text-accent-400 bg-gray-900 px-1.5 py-0.5 rounded text-[11px]">
                    cd backend && uvicorn app.main:app --reload
                  </code>
                </p>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* ── Input Bar (only after conversation starts) ── */}
        {hasConversation && (
        <div className="p-4 border-t border-gray-800/60 bg-gray-950/80 backdrop-blur-sm">
          <div className="max-w-[720px] mx-auto">
            <div className="relative group/input">
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-accent-500/30 via-violet-500/20 to-accent-500/30 opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-300 blur-sm" />

              <div className="relative flex items-center gap-2 bg-gray-900/80 border border-gray-800/60 rounded-2xl px-4 py-2.5 focus-within:border-accent-500/40 focus-within:bg-gray-900 transition-all duration-200 shadow-sm">
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleRun()}
                  placeholder={mode === "research" ? "Ask a follow-up for the report…" : "Ask a follow-up…"}
                  className="flex-1 bg-transparent text-[14px] text-gray-0 placeholder:text-gray-600 focus:outline-none py-1"
                  disabled={isRunning}
                />
                <ModeToggle mode={mode} onChange={setMode} />
                <button
                  onClick={handleRun}
                  disabled={!query.trim() || isRunning}
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0",
                    query.trim() && !isRunning
                      ? "bg-white text-gray-0 hover:bg-gray-100 hover:scale-[1.04] active:scale-[0.97]"
                      : "bg-gray-800 text-gray-600",
                  )}
                >
                  {isRunning ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowUp className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            {hasConversation && (
              <p className="text-[10px] text-gray-600 mt-2 text-center">
                Scout may produce inaccurate information. Verify important details independently.
              </p>
            )}
          </div>
        </div>
        )}
      </div>

      {/* ── Research Hub (slide-over) ── */}
      <div className={cn(
        "absolute right-0 top-0 bottom-0 w-[420px] bg-gray-950 border-l border-gray-800/60 flex flex-col transition-transform duration-300 ease-out z-10",
        workspaceOpen ? "translate-x-0" : "translate-x-full",
      )}>
        {/* Panel header */}
        <div className="px-5 py-3.5 border-b border-gray-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent-500/10 border border-accent-500/15 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-accent-400" />
            </div>
            <div>
              <span className="text-[13px] font-semibold text-gray-200">Research Hub</span>
              {(isRunning) && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-2 align-middle" />
              )}
            </div>
          </div>
          <button
            onClick={() => setWorkspaceOpen(false)}
            className="p-1.5 rounded-lg hover:bg-gray-800/70 text-gray-500 hover:text-gray-300 transition-all"
          >
            <PanelRightClose className="w-4 h-4" />
          </button>
        </div>

        {/* Tab toggle */}
        <div className="px-4 py-2 border-b border-gray-800/40 flex items-center gap-1">
          <button
            onClick={() => { setPanelTab("library"); setSelectedReport(null); }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all",
              panelTab === "library"
                ? "bg-gray-800 text-gray-200"
                : "text-gray-500 hover:text-gray-300",
            )}
          >
            <Library className="w-3 h-3" />
            Report Library
            {reports.length > 0 && (
              <span className="text-[9px] font-bold text-accent-400">({reports.length})</span>
            )}
          </button>
          <button
            onClick={() => { setPanelTab("pipeline"); setSelectedReport(null); }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all",
              panelTab === "pipeline"
                ? "bg-gray-800 text-gray-200"
                : "text-gray-500 hover:text-gray-300",
            )}
          >
            <FileText className="w-3 h-3" />
            Live Pipeline
            {isRunning && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-y-auto" ref={workspaceScrollRef}>
          {/* ── Report Detail View ── */}
          {selectedReport && panelTab === "library" && (
            <div className="p-5">
              {/* Breadcrumb */}
              <button
                onClick={() => setSelectedReport(null)}
                className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-300 transition-colors mb-4"
              >
                <ArrowLeft className="w-3 h-3" />
                Library
              </button>

              {/* Report header */}
              <div className="mb-4">
                <h3 className="text-[15px] font-semibold text-gray-200 leading-snug mb-1">
                  {selectedReport.title}
                </h3>
                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                  <Clock className="w-3 h-3" />
                  {new Date(selectedReport.createdAt).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  <span>·</span>
                  <Badge variant="info" size="sm">Research Report</Badge>
                </div>
              </div>

              {/* Source query breadcrumb */}
              {selectedReport.sourceQuery && (
                <div className="bg-gray-950/80 border border-gray-800/60 rounded-lg p-3 mb-5">
                  <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Source Query
                  </p>
                  <p className="text-[12px] text-gray-400 leading-relaxed italic">
                    "{selectedReport.sourceQuery}"
                  </p>
                </div>
              )}

              {/* Report content */}
              <div className="bg-gray-950/80 border border-gray-800/60 rounded-xl p-4 text-[13px] text-gray-300 whitespace-pre-wrap leading-relaxed">
                {selectedReport.content}
              </div>

              {/* Follow up button */}
              <button
                onClick={() => handleFollowUp(selectedReport)}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-accent-500/10 border border-accent-500/20 text-[13px] text-accent-400 font-medium hover:bg-accent-500/15 hover:border-accent-500/30 transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Follow up with Scout
              </button>
            </div>
          )}

          {/* ── Report Library ── */}
          {panelTab === "library" && !selectedReport && (
            <>
              {reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-8">
                  <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center mb-5">
                    <Library className="w-7 h-7 text-gray-600" />
                  </div>
                  <h3 className="text-[14px] font-semibold text-gray-400 mb-1.5">Report Library</h3>
                  <p className="text-[12px] text-gray-600 leading-relaxed max-w-[260px]">
                    Ask Scout in <strong>Report</strong> mode or click <strong>Create Research Report</strong> on any chat response to save reports here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-800/40">
                  {reports.map((report) => (
                    <button
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className="w-full text-left px-5 py-4 hover:bg-accent-500/3 transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent-500/10 border border-accent-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FileText className="w-3.5 h-3.5 text-accent-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-gray-200 group-hover:text-gray-0 transition-colors truncate">
                            {report.title}
                          </p>
                          {report.sourceQuery && (
                            <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1 italic">
                              "{report.sourceQuery}"
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="info" size="sm">Research Report</Badge>
                            <span className="text-[10px] text-gray-600">
                              {new Date(report.createdAt).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors flex-shrink-0 mt-1" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Live Pipeline ── */}
          {panelTab === "pipeline" && (
            <>
              {!isRunning && !liveContent && messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-8">
                  <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center mb-5">
                    <FileText className="w-7 h-7 text-gray-600" />
                  </div>
                  <h3 className="text-[14px] font-semibold text-gray-400 mb-1.5">Live Pipeline</h3>
                  <p className="text-[12px] text-gray-600 leading-relaxed max-w-[260px]">
                    Ask Scout a question to see the agent pipeline and live document appear here in real time.
                  </p>
                </div>
              ) : (
                <>
                  {/* Agent Pipeline */}
                  {(isRunning || liveContent) && (
                    <div className="p-5 border-b border-gray-800/40">
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Agent Pipeline
                      </p>
                      <div className="relative">
                        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gray-800" />
                        <div className="space-y-3">
                          {steps.map((step) => (
                            <div key={step.id} className="relative flex items-start gap-3 pl-7">
                              <div className={cn(
                                "absolute left-[5px] top-0.5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                                step.status === "complete" && "bg-emerald-500/20 border-emerald-500",
                                step.status === "running" && "bg-accent-500/20 border-accent-500",
                                step.status === "pending" && "bg-transparent border-gray-700",
                              )}>
                                {step.status === "complete" && (
                                  <CheckCircle2 className="w-2 h-2 text-emerald-400" />
                                )}
                                {step.status === "running" && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />
                                )}
                              </div>
                              <step.icon className={cn(
                                "w-3.5 h-3.5 flex-shrink-0 mt-0.5 transition-colors duration-300",
                                step.status === "complete" && "text-emerald-400",
                                step.status === "running" && "text-accent-400",
                                step.status === "pending" && "text-gray-600",
                              )} />
                              <div className="min-w-0">
                                <p className={cn(
                                  "text-[12px] leading-snug transition-colors duration-300",
                                  step.status === "running" && "text-accent-300 font-medium",
                                  step.status === "complete" && "text-gray-400",
                                  step.status === "pending" && "text-gray-600",
                                )}>
                                  {step.label}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Live Document */}
                  {(isRunning || liveContent) && (
                    <div className="p-5">
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-6 h-6 rounded-md bg-accent-500/10 border border-accent-500/15 flex items-center justify-center">
                          <FileText className="w-3 h-3 text-accent-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-medium text-gray-200 truncate">
                            {messages[messages.length - 1]?.role === "user"
                              ? messages[messages.length - 1]?.content.slice(0, 55) ?? "Research"
                              : "Research Report"}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {isRunning ? "Writing…" : "Complete"}
                          </p>
                        </div>
                        {savedFileId && (
                          <Badge variant="success" size="sm">Saved</Badge>
                        )}
                      </div>

                      <div className="bg-gray-950/80 border border-gray-800/60 rounded-xl p-4 text-[13px] text-gray-300 whitespace-pre-wrap leading-relaxed min-h-[200px] max-h-[calc(100vh-400px)] overflow-y-auto">
                        {liveContent || (
                          <span className="text-gray-600 italic">Waiting for agent output…</span>
                        )}
                        {isRunning && (
                          <span className="inline-block w-2 h-4 bg-accent-400 ml-0.5 align-middle animate-pulse rounded-sm" />
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Animated dot pulse for "thinking" state */
function DotPulse() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-emerald-400/50 animate-bounce"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: "0.8s" }}
        />
      ))}
    </div>
  );
}
