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
  Pin,
  Plus,
  ExternalLink,
} from "lucide-react";
import Badge from "@/components/shared/Badge";
import CompanyLogo from "@/components/shared/CompanyLogo";
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
  { title: "AI Robotics", query: "Find promising AI robotics startups founded by researchers from top labs", icon: Zap },
  { title: "Synthetic Biology", query: "Map the synthetic biology landscape for companies using generative AI", icon: Sparkles },
  { title: "Climate Tech", query: "Identify early-stage climate tech startups with strong technical moats", icon: Search },
  { title: "Agent Infrastructure", query: "Find AI agent companies building autonomous workflow infrastructure", icon: Brain },
];

// ── Mock chat history ─────────────────────────────────

interface ChatThread {
  id: string;
  label: string;
  query: string;
  time: string;
  pinned?: boolean;
}

const PINNED_THREADS: ChatThread[] = [
  { id: "p1", label: "Stealth AI Infra - Ex-Stripe", query: "Find AI infra startups with Stripe alumni", time: "2h ago", pinned: true },
  { id: "p2", label: "Climate Deep Tech Watchlist", query: "Track climate tech Series A+ companies", time: "5h ago", pinned: true },
];

const RECENT_THREADS: { group: string; threads: ChatThread[] }[] = [
  {
    group: "Today",
    threads: [
      { id: "t1", label: "Seed-stage Robotics Search", query: "Find seed-stage AI robotics startups", time: "11:18 AM" },
      { id: "t2", label: "Rex.fit Company Analysis", query: "can u make a report on Rex.fit", time: "11:17 AM" },
    ],
  },
  {
    group: "Yesterday",
    threads: [
      { id: "t3", label: "GenAI Drug Discovery", query: "Map the AI drug discovery landscape", time: "3:42 PM" },
      { id: "t4", label: "Fintech Infrastructure", query: "Find fintech infra startups in NYC", time: "10:15 AM" },
    ],
  },
];

// ── Mode Toggle Pill ──────────────────────────────────

function ModeTogglePill({ mode, onChange }: { mode: "quick" | "research"; onChange: (m: "quick" | "research") => void }) {
  return (
    <div className="flex items-center bg-white/5 rounded-full p-0.5 border border-white/5">
      <button
        onClick={() => onChange("quick")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-all duration-200",
          mode === "quick"
            ? "bg-white/10 text-white border border-white/10"
            : "text-white/40 hover:text-white/70",
        )}
      >
        <MessageSquare className="w-3 h-3" />
        Quick Answer
      </button>
      <button
        onClick={() => onChange("research")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-all duration-200",
          mode === "research"
            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
            : "text-white/40 hover:text-white/70",
        )}
      >
        <FileSpreadsheet className="w-3 h-3" />
        Deep Report
      </button>
    </div>
  );
}

// ── Thinking State ────────────────────────────────────

function ThinkingState({ steps, liveContent }: { steps: AgentStep[]; liveContent: string }) {
  const [expanded, setExpanded] = useState(true);
  const runningStep = steps.find((s) => s.status === "running");
  const doneCount = steps.filter((s) => s.status === "complete").length;
  const progressPct = (doneCount / steps.length) * 100;

  return (
    <div className="mb-1">
      {/* Gradient progress bar */}
      <div className="h-[1px] w-full bg-white/5 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-400 transition-all duration-700 ease-out rounded-full"
          style={{ width: `${Math.max(progressPct, 5)}%` }}
        />
      </div>

      {/* Accordion header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-[11px] text-white/50 hover:text-white/70 transition-colors w-full"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-medium">Scout is working{runningStep ? ` — ${runningStep.label.toLowerCase()}` : "…"}</span>
        <span className="text-[10px] text-white/30 ml-auto">{doneCount}/{steps.length} steps</span>
      </button>

      {/* Expanded steps */}
      {expanded && (
        <div className="mt-2 pl-3.5 border-l border-white/5 space-y-1.5">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center gap-2">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full flex-shrink-0",
                step.status === "complete" && "bg-emerald-400",
                step.status === "running" && "bg-blue-400 animate-pulse",
                step.status === "pending" && "bg-white/10",
              )} />
              <span className={cn(
                "text-[11px]",
                step.status === "complete" && "text-white/40",
                step.status === "running" && "text-white/80",
                step.status === "pending" && "text-white/20",
              )}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Inline Company Card ───────────────────────────────

interface InlineCompany {
  name: string;
  stage: string;
  employees: number;
  growth?: string;
  funding: string;
  location: string;
  description?: string;
}

function InlineCompanyGrid({ companies }: { companies: InlineCompany[] }) {
  return (
    <div className="my-3 rounded-xl bg-[#1A1A1E] border border-white/[0.04] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-white/[0.04]">
              <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Company</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Stage</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Team</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Funding</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Location</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {companies.map((c, i) => (
              <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group/row">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <CompanyLogo name={c.name} size="sm" />
                    <div>
                      <p className="text-[13px] font-semibold text-white/90 group-hover/row:text-white transition-colors">{c.name}</p>
                      {c.description && <p className="text-[11px] text-white/30 truncate max-w-[180px]">{c.description}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[11px] text-white/50">{c.stage}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[11px] text-white/70 font-mono tabular-nums">
                    {c.employees}
                    {c.growth && (
                      <span className="ml-1 text-emerald-400">▲ {c.growth}</span>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[11px] text-white/60 font-mono">{c.funding}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[11px] text-white/40">{c.location}</span>
                </td>
                <td className="px-2 py-3 opacity-0 group-hover/row:opacity-100 transition-opacity">
                  <button className="p-1 rounded text-white/30 hover:text-blue-400 hover:bg-white/5 transition-all">
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2 px-4 py-2.5 border-t border-white/[0.04] bg-white/[0.01]">
        <button className="text-[10px] text-white/40 hover:text-white/70 transition-colors font-medium">
          Open in Discover Grid →
        </button>
        <span className="text-white/10">|</span>
        <button className="text-[10px] text-white/40 hover:text-white/70 transition-colors font-medium">
          Export Shortlist to CSV
        </button>
      </div>
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

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToFiles(user.uid, (files) => {
      setReports(files.filter((f) => f.createdBy === "scout"));
    });
    return unsub;
  }, [user]);

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
    <div className="flex h-full bg-[#121214] text-white">
      {/* ── Chat History Rail (Left) ── */}
      <div className="w-[260px] flex-shrink-0 bg-[#0A0A0C] border-r border-white/[0.06] flex flex-col">
        {/* New session button */}
        <div className="p-3">
          <button
            onClick={() => { setMessages([]); setLiveContent(""); setError(null); setSteps(defaultSteps); }}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 border border-white/[0.06] text-[12px] text-white/60 hover:text-white/90 hover:bg-white/[0.08] transition-all font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            New Scout Session
          </button>
        </div>

        {/* Pinned */}
        {PINNED_THREADS.length > 0 && (
          <div className="px-3 pb-2">
            <p className="text-[9px] font-semibold text-white/20 uppercase tracking-widest px-1 mb-1.5">Pinned</p>
            {PINNED_THREADS.map((t) => (
              <button
                key={t.id}
                onClick={() => setQuery(t.query)}
                className="w-full text-left px-2.5 py-1.5 rounded-md text-[11px] text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all group flex items-center gap-2"
              >
                <Pin className="w-3 h-3 text-white/20 group-hover:text-white/40 flex-shrink-0" />
                <span className="truncate">{t.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Threads by time */}
        <div className="flex-1 overflow-y-auto px-3">
          {RECENT_THREADS.map((group) => (
            <div key={group.group} className="mb-3">
              <p className="text-[9px] font-semibold text-white/15 uppercase tracking-widest px-1 mb-1.5">{group.group}</p>
              {group.threads.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setQuery(t.query)}
                  className="w-full text-left px-2.5 py-1.5 rounded-md text-[11px] text-white/35 hover:text-white/60 hover:bg-white/[0.03] transition-all group"
                >
                  <p className="truncate font-medium">{t.label}</p>
                  <p className="text-[10px] text-white/15 mt-0.5">{t.time}</p>
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Research library shortcut */}
        <div className="px-3 pb-3 border-t border-white/[0.04] pt-2">
          <button
            onClick={() => { setWorkspaceOpen(true); setPanelTab("library"); }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all"
          >
            <Library className="w-3 h-3" />
            Research Library
            {reports.length > 0 && (
              <span className="ml-auto text-[9px] font-bold text-blue-400">{reports.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* ── Conversational Viewport (Center) ── */}
      <div className={cn(
        "flex flex-col flex-1 min-w-0 bg-[#121214] transition-all duration-300",
        workspaceOpen ? "mr-[420px]" : "",
      )}>
        {/* Header bar */}
        <div className="px-6 py-3 border-b border-white/[0.04] bg-[#121214]/90 backdrop-blur-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center">
              <Crosshair className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-white leading-tight">Scout</h2>
              <p className="text-[10px] text-white/30 font-medium">AI-powered startup intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasConversation && !workspaceOpen && (
              <button
                onClick={() => setWorkspaceOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all font-medium"
              >
                <FileText className="w-3 h-3" />
                Research panel
                <ChevronRight className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto pb-48">
          {/* Empty State */}
          {!hasConversation && (
            <div className="flex flex-col items-center justify-center h-full px-6 py-12">
              <div className="text-center max-w-2xl mx-auto">
                <div className="relative mb-8">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-center">
                    <Crosshair className="w-9 h-9 text-blue-400" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                </div>

                <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Research any market</h1>
                <p className="text-[15px] text-white/40 leading-relaxed mb-1">
                  discover startups, and surface investment opportunities
                </p>
                <p className="text-[12px] text-white/20 leading-relaxed">
                  Scout orchestrates specialized AI agents to research, analyze, and synthesize insights from across the startup ecosystem.
                </p>
              </div>

              {/* Suggestion cards */}
              <div className="mt-10 w-full max-w-2xl mx-auto" style={{ animationDelay: "0.1s" }}>
                <p className="text-[10px] font-semibold text-white/20 uppercase tracking-wider mb-3 text-center">
                  Try asking about
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {suggestions.map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => { setQuery(s.query); inputRef.current?.focus(); }}
                        className="group relative text-left p-4 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-200"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/15 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-3.5 h-3.5 text-blue-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-white/80 mb-0.5">{s.title}</p>
                            <p className="text-[11px] text-white/30 leading-relaxed line-clamp-2">{s.query}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <div key={msg.id} className={cn("px-6 py-6 transition-colors duration-150", msg.role === "agent" ? "" : "bg-white/[0.005]")}>
              <div className="max-w-[720px] mx-auto">
                {/* Agent message: left-aligned */}
                {msg.role === "agent" && (
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[11px] font-semibold text-emerald-400">Scout</span>
                        <span className="text-[10px] text-white/20">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      {/* Message content — check if it contains structured data */}
                      <div className="text-[13px] text-white/70 leading-[1.7] whitespace-pre-wrap">
                        {msg.content}
                      </div>

                      {/* Show inline data grid for messages that look like company listings */}
                      {msg.content.includes("## Research Results") && (
                        <InlineCompanyGrid
                          companies={[
                            { name: "Neural Labs", stage: "Seed", employees: 24, growth: "15%", funding: "$10M", location: "San Francisco, CA", description: "AI infrastructure for scientific discovery" },
                            { name: "RoboSynth", stage: "Series A", employees: 56, growth: "32%", funding: "$32M", location: "Boston, MA", description: "Robotics foundation models" },
                            { name: "Synthex Bio", stage: "Series A", employees: 72, growth: "18%", funding: "$45M", location: "Cambridge, MA", description: "AI-designed protein therapies" },
                            { name: "Solara Climate", stage: "Series B", employees: 94, funding: "$85M", location: "Oakland, CA", description: "Direct air capture" },
                          ]}
                        />
                      )}

                      {/* Action bar */}
                      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/[0.04]">
                        {msg.savedToWorkspace ? (
                          <span className="text-[10px] text-emerald-400/80 font-medium flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3" />
                            Saved to library
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleCreateReport(msg)}
                              disabled={reportSubmitting}
                              className={cn(
                                "text-[10px] font-medium flex items-center gap-1.5 transition-all px-2.5 py-1 rounded-full border",
                                reportSubmitting
                                  ? "text-white/20 border-white/[0.04] cursor-not-allowed"
                                  : "text-blue-400 border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/30",
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
                              className="text-[10px] text-white/30 hover:text-white/50 font-medium flex items-center gap-1.5 transition-colors"
                            >
                              <Copy className="w-3 h-3" />
                              Copy
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* User message: right-aligned */}
                {msg.role === "user" && (
                  <div className="flex items-start gap-3 justify-end">
                    <div className="min-w-0 max-w-[80%]">
                      <div className="flex items-center gap-2 mb-1.5 justify-end">
                        <span className="text-[10px] text-white/20">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className="text-[11px] font-semibold text-white/50">You</span>
                      </div>
                      <div className="text-[13px] text-white/80 leading-[1.6] bg-white/[0.03] border border-white/[0.04] rounded-2xl rounded-br-md px-4 py-3">
                        {msg.content}
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Streaming Response */}
          {isRunning && (
            <div className="px-6 py-6">
              <div className="max-w-[720px] mx-auto">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[11px] font-semibold text-emerald-400">Scout</span>
                    </div>

                    <ThinkingState steps={steps} liveContent={liveContent} />

                    {liveContent ? (
                      <div className="text-[13px] text-white/70 leading-[1.7] whitespace-pre-wrap">
                        {liveContent}
                        <span className="inline-block w-1.5 h-4 bg-emerald-400/80 ml-0.5 align-middle animate-pulse rounded-sm" />
                      </div>
                    ) : (
                      <div className="text-[12px] text-white/20">Initializing research pipeline…</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="px-6 py-4">
              <div className="max-w-[720px] mx-auto bg-red-500/5 border border-red-500/10 rounded-xl p-4">
                <p className="text-[12px] text-red-400/80 font-medium">{error}</p>
                <p className="text-[11px] text-white/20 mt-1.5">
                  Ensure the backend is running:{" "}
                  <code className="text-blue-400 bg-white/5 px-1.5 py-0.5 rounded text-[10px]">
                    cd backend && uvicorn app.main:app --reload
                  </code>
                </p>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* ── Prompt Command Deck (Bottom Fixed) ── */}
      <div className={cn(
        "absolute bottom-0 left-[260px] right-0 z-20 pb-6 pt-4 px-6",
        workspaceOpen ? "right-[420px]" : "",
      )}>
        <div className="max-w-3xl mx-auto">
          <div className={cn(
            "relative bg-[#1a1a1c]/80 backdrop-blur-xl border rounded-2xl p-3 transition-all duration-300",
            "border-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
            "focus-within:border-white/[0.12] focus-within:shadow-[0_0_24px_rgba(59,130,246,0.08)]",
          )}>
            {/* Mode toggle */}
            <div className="flex items-center justify-between mb-2.5 px-1">
              <ModeTogglePill mode={mode} onChange={setMode} />
              <span className="text-[9px] text-white/15 font-medium">
                {mode === "research" ? "Deep report mode" : "Quick answer mode"}
              </span>
            </div>

            {/* Input row */}
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleRun()}
                placeholder={mode === "research"
                  ? "Ask for a deep research report on a company or market..."
                  : hasConversation ? "Ask a follow-up…" : "Ask Scout to research anything…"}
                className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/20 focus:outline-none py-1.5"
                disabled={isRunning}
                autoFocus
              />
              <button
                onClick={handleRun}
                disabled={!query.trim() || isRunning}
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0",
                  query.trim() && !isRunning
                    ? "bg-white text-[#121214] hover:bg-white/90 hover:scale-[1.04] active:scale-[0.97]"
                    : "bg-white/[0.04] text-white/20",
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
            <p className="text-[9px] text-white/15 mt-2 text-center">
              Scout may produce inaccurate information. Verify important details independently.
            </p>
          )}
        </div>
      </div>

      {/* ── Research Hub (Slide-over) ── */}
      <div className={cn(
        "absolute right-0 top-0 bottom-0 w-[420px] bg-[#0A0A0C] border-l border-white/[0.06] flex flex-col z-10",
        "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
        "shadow-[-24px_0_48px_rgba(0,0,0,0.5)]",
        workspaceOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
      )}>
        {/* Panel header */}
        <div className="px-5 py-3.5 border-b border-white/[0.04] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/15 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div>
              <span className="text-[13px] font-semibold text-white/90">Research Hub</span>
              {isRunning && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-2 align-middle" />
              )}
            </div>
          </div>
          <button
            onClick={() => setWorkspaceOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/[0.04] text-white/30 hover:text-white/60 transition-all"
          >
            <PanelRightClose className="w-4 h-4" />
          </button>
        </div>

        {/* Tab toggle */}
        <div className="px-4 py-2 border-b border-white/[0.04] flex items-center gap-1">
          <button
            onClick={() => { setPanelTab("library"); setSelectedReport(null); }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all",
              panelTab === "library"
                ? "bg-white/[0.06] text-white/80"
                : "text-white/30 hover:text-white/50",
            )}
          >
            <Library className="w-3 h-3" />
            Report Library
            {reports.length > 0 && (
              <span className="text-[9px] font-bold text-blue-400">({reports.length})</span>
            )}
          </button>
          <button
            onClick={() => { setPanelTab("pipeline"); setSelectedReport(null); }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all",
              panelTab === "pipeline"
                ? "bg-white/[0.06] text-white/80"
                : "text-white/30 hover:text-white/50",
            )}
          >
            <FileText className="w-3 h-3" />
            Live Pipeline
            {isRunning && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Panel content — simplified (keeping existing functionality) */}
        <div className="flex-1 overflow-y-auto" ref={workspaceScrollRef}>
          {selectedReport && panelTab === "library" && (
            <div className="p-5">
              <button
                onClick={() => setSelectedReport(null)}
                className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/60 transition-colors mb-4"
              >
                <ArrowLeft className="w-3 h-3" /> Library
              </button>

              <h3 className="text-[15px] font-semibold text-white/90 leading-snug mb-1">{selectedReport.title}</h3>
              <div className="flex items-center gap-2 text-[10px] text-white/30 mb-4">
                <Clock className="w-3 h-3" />
                {new Date(selectedReport.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
              </div>

              {selectedReport.sourceQuery && (
                <div className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-3 mb-5">
                  <p className="text-[9px] font-semibold text-white/20 uppercase tracking-wider mb-1">Source Query</p>
                  <p className="text-[11px] text-white/40 leading-relaxed italic">"{selectedReport.sourceQuery}"</p>
                </div>
              )}

              <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 text-[12px] text-white/60 whitespace-pre-wrap leading-relaxed">
                {selectedReport.content}
              </div>

              <button
                onClick={() => handleFollowUp(selectedReport)}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[12px] text-blue-400 font-medium hover:bg-blue-500/15 transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Follow up with Scout
              </button>
            </div>
          )}

          {panelTab === "library" && !selectedReport && (
            <div className="divide-y divide-white/[0.03]">
              {reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-8 py-20">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center mb-5">
                    <Library className="w-7 h-7 text-white/10" />
                  </div>
                  <h3 className="text-[14px] font-semibold text-white/30 mb-1.5">Report Library</h3>
                  <p className="text-[11px] text-white/15 leading-relaxed max-w-[260px]">
                    Use <strong className="text-white/30">Deep Report</strong> mode or click <strong className="text-white/30">Create Research Report</strong> on any Scout response.
                  </p>
                </div>
              ) : (
                reports.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    className="w-full text-left px-5 py-4 hover:bg-white/[0.02] transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/5 border border-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FileText className="w-3.5 h-3.5 text-blue-400/60" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-white/70 group-hover:text-white/90 transition-colors truncate">{report.title}</p>
                        {report.sourceQuery && (
                          <p className="text-[10px] text-white/20 mt-0.5 line-clamp-1 italic">"{report.sourceQuery}"</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[9px] text-white/20">
                            {new Date(report.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/15 group-hover:text-white/30 transition-colors flex-shrink-0 mt-1" />
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {panelTab === "pipeline" && (
            <div className="p-5">
              {!isRunning && !liveContent && messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-20">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center mb-5">
                    <FileText className="w-7 h-7 text-white/10" />
                  </div>
                  <p className="text-[13px] text-white/30">Live Pipeline</p>
                  <p className="text-[11px] text-white/15 mt-1 max-w-[220px]">
                    Ask Scout to see the agent pipeline and live document in real time.
                  </p>
                </div>
              ) : (
                <>
                  <ThinkingState steps={steps} liveContent={liveContent} />
                  {liveContent && (
                    <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 text-[12px] text-white/50 whitespace-pre-wrap leading-relaxed mt-4 max-h-[calc(100vh-280px)] overflow-y-auto">
                      {liveContent}
                      {isRunning && (
                        <span className="inline-block w-2 h-4 bg-blue-400 ml-0.5 align-middle animate-pulse rounded-sm" />
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
