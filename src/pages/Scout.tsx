import { useState, useCallback, useEffect, useMemo } from "react";
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
} from "@assistant-ui/react";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import type { ChatModelAdapter } from "@assistant-ui/react";
import {
  Crosshair,
  Sparkles,
  Zap,
  Brain,
  Search,
  FileText,
  Library,
  PanelRightClose,
  ArrowLeft,
  Clock,
  MessageSquare,
  ChevronRight,
  Pin,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { streamAgentChunks } from "@/lib/backend-client";
import { addFile, subscribeToFiles } from "@/data/workspace";
import type { WorkspaceFile } from "@/data/workspace";
import { useAuth } from "@/contexts/AuthContext";

// ── Suggestions ────────────────────────────────────────

const suggestions = [
  { title: "AI Robotics", query: "Find promising AI robotics startups founded by researchers from top labs", icon: Zap },
  { title: "Synthetic Biology", query: "Map the synthetic biology landscape for companies using generative AI", icon: Sparkles },
  { title: "Climate Tech", query: "Identify early-stage climate tech startups with strong technical moats", icon: Search },
  { title: "Agent Infrastructure", query: "Find AI agent companies building autonomous workflow infrastructure", icon: Brain },
];

// ── Thread types ───────────────────────────────────────

interface ChatThread {
  id: string;
  label: string;
  query: string;
  time: string;
  pinned?: boolean;
}

const PINNED_THREADS: ChatThread[] = [];
const RECENT_THREADS: { group: string; threads: ChatThread[] }[] = [];

// ── Inner Chat Component ───────────────────────────────

function ScoutChat({
  workspaceOpen,
  setWorkspaceOpen,
  onQuerySelect,
}: {
  workspaceOpen: boolean;
  setWorkspaceOpen: (v: boolean) => void;
  onQuerySelect: (q: string) => void;
}) {
  return (
    <div className={cn(
      "flex flex-col flex-1 min-w-0 bg-zinc-900 transition-all duration-300",
      workspaceOpen ? "mr-[420px]" : "",
    )}>
      {/* Header */}
      <div className="px-6 py-3 border-b border-white/[0.06] bg-zinc-900/90 backdrop-blur-sm flex items-center justify-between flex-shrink-0">
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
          {!workspaceOpen && (
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

      {/* Thread */}
      <ThreadPrimitive.Root className="flex flex-col flex-1 min-h-0">
        <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto">
          {/* Empty state */}
          <ThreadPrimitive.Empty>
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
                  Scout orchestrates specialized AI agents to research, analyze, and synthesize insights
                  from across the startup ecosystem.
                </p>
              </div>

              {/* Suggestion cards */}
              <div className="mt-10 w-full max-w-2xl mx-auto">
                <p className="text-[10px] font-semibold text-white/20 uppercase tracking-wider mb-3 text-center">
                  Try asking about
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {suggestions.map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => onQuerySelect(s.query)}
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
          </ThreadPrimitive.Empty>

          {/* Messages */}
          <ThreadPrimitive.Messages
            components={{
              UserMessage: () => (
                <MessagePrimitive.Root className="px-6 py-4 flex justify-end">
                  <div className="max-w-[720px] w-full flex items-start gap-3 justify-end">
                    <div className="min-w-0 max-w-[80%]">
                      <div className="flex items-center gap-2 mb-1 justify-end">
                        <span className="text-[10px] text-white/20">
                          {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className="text-[11px] font-semibold text-white/50">You</span>
                      </div>
                      <div className="text-[13px] text-white/80 leading-[1.6] bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-br-md px-4 py-3">
                        <MessagePrimitive.Content />
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-semibold text-blue-400">Y</span>
                    </div>
                  </div>
                </MessagePrimitive.Root>
              ),
              AssistantMessage: () => (
                <MessagePrimitive.Root className="px-6 py-6">
                  <div className="max-w-[720px] mx-auto flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[11px] font-semibold text-emerald-400">Scout</span>
                      </div>
                      <div className="text-[13px] text-white/75 leading-[1.75] prose prose-invert prose-sm max-w-none
                        prose-headings:text-white prose-headings:font-semibold
                        prose-h2:text-[15px] prose-h2:mt-5 prose-h2:mb-2
                        prose-h3:text-[13px] prose-h3:mt-4 prose-h3:mb-1.5
                        prose-p:my-2 prose-p:leading-relaxed
                        prose-strong:text-white/90 prose-strong:font-semibold
                        prose-li:my-0.5
                        prose-code:text-blue-400 prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[11px]
                        prose-pre:bg-white/[0.03] prose-pre:border prose-pre:border-white/[0.06] prose-pre:rounded-xl
                        [&_table]:w-full [&_table]:text-[11px] [&_table]:border-collapse
                        [&_th]:text-left [&_th]:px-3 [&_th]:py-2 [&_th]:text-white/40 [&_th]:text-[10px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wider [&_th]:border-b [&_th]:border-white/[0.06]
                        [&_td]:px-3 [&_td]:py-2.5 [&_td]:border-b [&_td]:border-white/[0.03] [&_td]:text-white/70
                        [&_tr:hover_td]:bg-white/[0.02]
                      ">
                        <MessagePrimitive.Content components={{ Text: MarkdownTextPrimitive }} />
                      </div>
                    </div>
                  </div>
                </MessagePrimitive.Root>
              ),
            }}
          />
        </ThreadPrimitive.Viewport>

        {/* Composer */}
        <div className="px-4 pb-5 pt-3 flex-shrink-0">
          <div className="max-w-2xl mx-auto">
            <ComposerPrimitive.Root className={cn(
              "relative bg-zinc-800/80 backdrop-blur-xl border rounded-2xl p-3 transition-all duration-300",
              "border-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
              "focus-within:border-white/[0.12] focus-within:shadow-[0_0_24px_rgba(59,130,246,0.08)]",
            )}>
              <div className="flex items-center gap-2">
                <ComposerPrimitive.Input
                  placeholder="Ask Scout to research anything…"
                  className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/20 focus:outline-none py-1.5"
                  autoFocus
                />
                <ComposerPrimitive.Send
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0
                    bg-white/10 text-white/40 hover:bg-white/20 hover:text-white/70
                    [[data-disabled]_&]:bg-white/[0.04] [[data-disabled]_&]:text-white/20"
                >
                  <span className="text-[18px]">↑</span>
                </ComposerPrimitive.Send>
              </div>
            </ComposerPrimitive.Root>
          </div>
        </div>
      </ThreadPrimitive.Root>
    </div>
  );
}

// ── Research Hub Slideover ──────────────────────────────

function ResearchHub({
  open,
  onClose,
  reports,
}: {
  open: boolean;
  onClose: () => void;
  reports: WorkspaceFile[];
}) {
  const [selectedReport, setSelectedReport] = useState<WorkspaceFile | null>(null);

  if (selectedReport) {
    return (
      <div className={cn(
        "absolute right-0 top-0 bottom-0 w-[420px] bg-zinc-950 border-l border-white/[0.06] flex flex-col z-10",
        "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
        "shadow-[-24px_0_48px_rgba(0,0,0,0.5)]",
        open ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none",
      )}>
        <div className="px-5 py-3.5 border-b border-white/[0.04] flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => setSelectedReport(null)}
            className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/60 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" /> Library
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.04] text-white/30 hover:text-white/60 transition-all">
            <PanelRightClose className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <h3 className="text-[15px] font-semibold text-white/90 leading-snug mb-1">{selectedReport.title}</h3>
          <div className="flex items-center gap-2 text-[10px] text-white/30 mb-4">
            <Clock className="w-3 h-3" />
            {new Date(selectedReport.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
          </div>
          <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 text-[12px] text-white/60 whitespace-pre-wrap leading-relaxed">
            {selectedReport.content}
          </div>
          <button
            onClick={() => {
              const input = document.querySelector('[role="textbox"]') as HTMLTextAreaElement;
              if (input) {
                const nativeSetter = Object.getOwnPropertyDescriptor(
                  window.HTMLTextAreaElement.prototype, "value"
                )?.set;
                if (nativeSetter) {
                  nativeSetter.call(input, `Regarding "${selectedReport.title.replace(/…$/, "")}": `);
                  input.dispatchEvent(new Event("input", { bubbles: true }));
                  input.focus();
                }
              }
              setSelectedReport(null);
            }}
            className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[12px] text-blue-400 font-medium hover:bg-blue-500/15 transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Follow up with Scout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "absolute right-0 top-0 bottom-0 w-[420px] bg-zinc-950 border-l border-white/[0.06] flex flex-col z-10",
      "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
      "shadow-[-24px_0_48px_rgba(0,0,0,0.5)]",
      open ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none",
    )}>
      <div className="px-5 py-3.5 border-b border-white/[0.04] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/15 flex items-center justify-center">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <span className="text-[13px] font-semibold text-white/90">Research Hub</span>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.04] text-white/30 hover:text-white/60 transition-all">
          <PanelRightClose className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-white/[0.03]">
        {reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8 py-20">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center mb-5">
              <Library className="w-7 h-7 text-white/10" />
            </div>
            <h3 className="text-[14px] font-semibold text-white/30 mb-1.5">Report Library</h3>
            <p className="text-[11px] text-white/15 leading-relaxed max-w-[260px]">
              Saved research reports will appear here after you run queries in Scout.
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
                  <p className="text-[13px] font-medium text-white/70 group-hover:text-white/90 transition-colors truncate">
                    {report.title}
                  </p>
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
    </div>
  );
}

// ── Chat Model Adapter ──────────────────────────────────

function createScoutAdapter(): ChatModelAdapter {
  return {
    async *run({ messages }) {
      // Extract the last user message text
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage || lastMessage.role !== "user") return;

      const content = lastMessage.content;
      if (!content || content.length === 0) return;

      const textPart = content.find((c: { type: string; text?: string }) => c.type === "text");
      const query = (textPart as { text?: string } | undefined)?.text ?? "";
      if (!query.trim()) return;

      // Stream chunks from the backend agent
      try {
        for await (const chunk of streamAgentChunks(query)) {
          yield {
            content: [{ type: "text" as const, text: chunk }],
          };
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Research failed";
        yield {
          content: [{ type: "text" as const, text: `\n\n> ⚠️ ${message}\n\n> Ensure the backend is running at the configured Railway URL.` }],
        };
      }
    },
  };
}

// ── Main Scout Component ────────────────────────────────

export default function Scout() {
  const { user } = useAuth();
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [reports, setReports] = useState<WorkspaceFile[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToFiles(user.uid, (files) => {
      setReports(files.filter((f) => f.createdBy === "scout"));
    });
    return unsub;
  }, [user]);

  // Create the chat model adapter (memoized)
  const adapter = useMemo(() => createScoutAdapter(), []);
  const runtime = useLocalRuntime(adapter);

  const handleQuerySelect = useCallback((query: string) => {
    const input = document.querySelector('[role="textbox"]') as HTMLTextAreaElement;
    if (input) {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, "value"
      )?.set;
      if (nativeSetter) {
        nativeSetter.call(input, query);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.focus();
      }
    }
  }, []);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex h-full bg-zinc-900 text-white relative overflow-hidden">
        {/* Left: Chat History Rail */}
        <div className="w-[260px] flex-shrink-0 bg-zinc-950 border-r border-white/[0.06] flex flex-col">
          <div className="p-3">
            <button
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 border border-white/[0.06] text-[12px] text-white/60 hover:text-white/90 hover:bg-white/[0.08] transition-all font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              New Scout Session
            </button>
          </div>

          {PINNED_THREADS.length > 0 && (
            <div className="px-3 pb-2">
              <p className="text-[9px] font-semibold text-white/20 uppercase tracking-widest px-1 mb-1.5">Pinned</p>
              {PINNED_THREADS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleQuerySelect(t.query)}
                  className="w-full text-left px-2.5 py-1.5 rounded-md text-[11px] text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all group flex items-center gap-2"
                >
                  <Pin className="w-3 h-3 text-white/20 group-hover:text-white/40 flex-shrink-0" />
                  <span className="truncate">{t.label}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-3">
            {RECENT_THREADS.map((group) => (
              <div key={group.group} className="mb-3">
                <p className="text-[9px] font-semibold text-white/15 uppercase tracking-widest px-1 mb-1.5">{group.group}</p>
                {group.threads.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleQuerySelect(t.query)}
                    className="w-full text-left px-2.5 py-1.5 rounded-md text-[11px] text-white/35 hover:text-white/60 hover:bg-white/[0.03] transition-all group"
                  >
                    <p className="truncate font-medium">{t.label}</p>
                    <p className="text-[10px] text-white/15 mt-0.5">{t.time}</p>
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className="px-3 pb-3 border-t border-white/[0.04] pt-2">
            <button
              onClick={() => setWorkspaceOpen(true)}
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

        {/* Center: Chat */}
        <ScoutChat
          workspaceOpen={workspaceOpen}
          setWorkspaceOpen={setWorkspaceOpen}
          onQuerySelect={handleQuerySelect}
        />

        {/* Right: Research Hub */}
        <ResearchHub
          open={workspaceOpen}
          onClose={() => setWorkspaceOpen(false)}
          reports={reports}
        />
      </div>
    </AssistantRuntimeProvider>
  );
}
