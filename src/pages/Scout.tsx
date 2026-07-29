import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
} from "@assistant-ui/react";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import type { ChatModelAdapter } from "@assistant-ui/react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
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
  Plus,
  Trash2,
  Check,
  Copy,
  Bot,
  User,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { streamAgentChunks } from "@/lib/backend-client";
import { subscribeToFiles } from "@/data/workspace";
import type { WorkspaceFile } from "@/data/workspace";
import { useAuth } from "@/contexts/AuthContext";

// ── Suggestions ────────────────────────────────────────

const suggestions = [
  { title: "AI Robotics", query: "Find promising AI robotics startups founded by researchers from top labs", icon: Zap },
  { title: "Synthetic Biology", query: "Map the synthetic biology landscape for companies using generative AI", icon: Sparkles },
  { title: "Climate Tech", query: "Identify early-stage climate tech startups with strong technical moats", icon: Search },
  { title: "Agent Infrastructure", query: "Find AI agent companies building autonomous workflow infrastructure", icon: Brain },
];

// ── Thread History Types & Storage ─────────────────────

interface SavedThread {
  id: string;
  title: string;
  query: string;
  timestamp: number;
  preview: string;
}

const THREADS_STORAGE_KEY = "scout_threads";
const ACTIVE_THREAD_KEY = "scout_active_thread";

function loadThreads(): SavedThread[] {
  try {
    const raw = localStorage.getItem(THREADS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveThreads(threads: SavedThread[]) {
  try {
    localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(threads));
  } catch { /* quota exceeded — ignore */ }
}

function saveActiveThread(id: string | null) {
  if (id) {
    try { localStorage.setItem(ACTIVE_THREAD_KEY, id); } catch { /* ignore */ }
  } else {
    try { localStorage.removeItem(ACTIVE_THREAD_KEY); } catch { /* ignore */ }
  }
}

function loadActiveThread(): string | null {
  try { return localStorage.getItem(ACTIVE_THREAD_KEY); } catch { return null; }
}

function generateId(): string {
  return crypto.randomUUID?.() ?? `thread-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── Code Block Component ───────────────────────────────

function CodeBlock({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) {
  const match = /language-(\w+)/.exec(className || "");
  const code = String(children).replace(/\n$/, "");
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  }, [code]);

  if (!match) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="group relative my-3">
      <div className="flex items-center justify-between px-4 py-1.5 bg-white/[0.04] border border-white/[0.06] border-b-0 rounded-t-xl">
        <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">{match[1]}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all opacity-0 group-hover:opacity-100"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        style={oneDark}
        language={match[1]}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: "0.75rem",
          borderBottomRightRadius: "0.75rem",
          border: "1px solid rgba(255,255,255,0.06)",
          borderTop: "none",
          fontSize: "12px",
          lineHeight: "1.6",
        } as React.CSSProperties}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

// ── Markdown Overrides ─────────────────────────────────

const markdownComponents = {
  code: CodeBlock,
};

// ── Chat Model Adapter ─────────────────────────────────

function createScoutAdapter(): ChatModelAdapter {
  return {
    async *run({ messages }) {
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage || lastMessage.role !== "user") return;

      const content = lastMessage.content;
      if (!content || content.length === 0) return;

      const textPart = content.find((c: { type: string; text?: string }) => c.type === "text");
      const query = (textPart as { text?: string } | undefined)?.text ?? "";
      if (!query.trim()) return;

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

// ── Typing Indicator ───────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 px-6 py-4">
      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
      </div>
      <div className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

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
      "flex flex-col flex-1 min-w-0 bg-zinc-900 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
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
              <div className="text-center max-w-2xl mx-auto animate-in fade-in duration-500">
                <div className="relative mb-8">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-center animate-in zoom-in duration-300">
                    <Crosshair className="w-9 h-9 text-blue-400" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center animate-in zoom-in duration-300 delay-150">
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
              <div className="mt-10 w-full max-w-2xl mx-auto animate-in slide-in-from-bottom-4 duration-500 delay-200">
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
                        className="group relative text-left p-4 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/15 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/15 transition-colors">
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
                <MessagePrimitive.Root className="px-6 py-4 flex justify-end animate-in slide-in-from-right-4 duration-300">
                  <div className="max-w-[720px] w-full flex items-start gap-3 justify-end">
                    <div className="min-w-0 max-w-[80%]">
                      <div className="flex items-center gap-2 mb-1 justify-end">
                        <span className="text-[10px] text-white/20">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        <span className="text-[11px] font-semibold text-white/50">You</span>
                      </div>
                      <div className="text-[13px] text-white/80 leading-[1.6] bg-blue-500/10 border border-blue-500/15 rounded-2xl rounded-br-md px-4 py-3 shadow-[0_2px_8px_rgba(59,130,246,0.08)]">
                        <MessagePrimitive.Content />
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                  </div>
                </MessagePrimitive.Root>
              ),
              AssistantMessage: () => (
                <MessagePrimitive.Root className="px-6 py-6 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="max-w-[720px] mx-auto flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[11px] font-semibold text-emerald-400">Scout</span>
                        <span className="text-[9px] text-white/15 border border-white/[0.06] rounded-full px-2 py-0.5 font-mono">AI</span>
                      </div>
                      <div className="text-[13px] text-white/75 leading-[1.75] prose prose-invert prose-sm max-w-none
                        prose-headings:text-white prose-headings:font-semibold
                        prose-h2:text-[15px] prose-h2:mt-5 prose-h2:mb-2 prose-h2:pb-1 prose-h2:border-b prose-h2:border-white/[0.04]
                        prose-h3:text-[13px] prose-h3:mt-4 prose-h3:mb-1.5
                        prose-p:my-2 prose-p:leading-relaxed
                        prose-strong:text-white/90 prose-strong:font-semibold
                        prose-li:my-0.5
                        prose-code:text-blue-400 prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[11px] prose-code:font-mono
                        prose-pre:bg-transparent prose-pre:p-0
                        prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                        prose-blockquote:border-l-2 prose-blockquote:border-emerald-500/30 prose-blockquote:pl-4 prose-blockquote:py-0.5 prose-blockquote:not-italic prose-blockquote:text-white/40
                        prose-hr:border-white/[0.04]
                        [&_table]:w-full [&_table]:text-[11px] [&_table]:border-collapse
                        [&_th]:text-left [&_th]:px-3 [&_th]:py-2 [&_th]:text-white/40 [&_th]:text-[10px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wider [&_th]:border-b [&_th]:border-white/[0.06]
                        [&_td]:px-3 [&_td]:py-2.5 [&_td]:border-b [&_td]:border-white/[0.03] [&_td]:text-white/70
                        [&_tr:hover_td]:bg-white/[0.02] [&_tr:last-child_td]:border-b-0
                      ">
                        <MessagePrimitive.Content components={{ Text: (props) => <MarkdownTextPrimitive {...props} components={markdownComponents} /> }} />
                      </div>
                    </div>
                  </div>
                </MessagePrimitive.Root>
              ),
            }}
          />

          {/* Inline typing indicator */}
          <ThreadPrimitive.If running>
            <TypingIndicator />
          </ThreadPrimitive.If>
        </ThreadPrimitive.Viewport>

        {/* Composer */}
        <div className="px-4 pb-5 pt-3 flex-shrink-0">
          <div className="max-w-2xl mx-auto">
            <ComposerPrimitive.Root className={cn(
              "relative bg-zinc-800/80 backdrop-blur-xl border rounded-2xl p-3 transition-all duration-300",
              "border-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
              "focus-within:border-white/[0.12] focus-within:shadow-[0_0_24px_rgba(59,130,246,0.08)] focus-within:bg-zinc-800/95",
            )}>
              <div className="flex items-center gap-2">
                <ComposerPrimitive.Input
                  placeholder="Ask Scout to research anything…"
                  className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/20 focus:outline-none py-1.5"
                  autoFocus
                />
                <ComposerPrimitive.Send
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0
                    bg-white/10 text-white/40 hover:bg-white/20 hover:text-white/70 hover:scale-105 active:scale-95
                    [[data-disabled]_&]:bg-white/[0.04] [[data-disabled]_&]:text-white/20 [[data-disabled]_&]:hover:scale-100"
                >
                  <span className="text-[18px]">↑</span>
                </ComposerPrimitive.Send>
              </div>
            </ComposerPrimitive.Root>
            <div className="flex items-center justify-center gap-1.5 mt-2.5">
              <span className="text-[9px] text-white/10 font-mono">Scout uses AI · verify important findings</span>
            </div>
          </div>
        </div>
      </ThreadPrimitive.Root>
    </div>
  );
}

// ── Thread Sidebar ─────────────────────────────────────

function ThreadSidebar({
  threads,
  activeId,
  onSelect,
  onDelete,
  onNew,
}: {
  threads: SavedThread[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const startEdit = useCallback((thread: SavedThread) => {
    setEditingId(thread.id);
    setEditTitle(thread.title);
  }, []);

  const saveEdit = useCallback(() => {
    if (!editingId || !editTitle.trim()) {
      setEditingId(null);
      return;
    }
    const saved = loadThreads();
    const updated = saved.map((t) =>
      t.id === editingId ? { ...t, title: editTitle.trim() } : t
    );
    saveThreads(updated);
    setEditingId(null);
  }, [editingId, editTitle]);

  return (
    <div className="w-[260px] flex-shrink-0 bg-zinc-950 border-r border-white/[0.06] flex flex-col">
      <div className="p-3">
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 border border-white/[0.06] text-[12px] text-white/60 hover:text-white/90 hover:bg-white/[0.08] hover:border-white/[0.12] transition-all font-medium active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
          New Scout Session
        </button>
      </div>

      {threads.length > 0 && (
        <div className="px-3 pb-2">
          <p className="text-[9px] font-semibold text-white/20 uppercase tracking-widest px-1 mb-2">Recent Sessions</p>
          <div className="space-y-0.5">
            {threads.map((thread) => (
              <div
                key={thread.id}
                className={cn(
                  "group flex items-center gap-1 rounded-lg transition-all duration-150",
                  thread.id === activeId
                    ? "bg-white/[0.04] border border-white/[0.06]"
                    : "hover:bg-white/[0.02] border border-transparent",
                )}
              >
                <button
                  onClick={() => onSelect(thread.id)}
                  className="flex-1 text-left px-2.5 py-2 min-w-0"
                >
                  {editingId === thread.id ? (
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="w-full bg-white/[0.06] border border-white/[0.1] rounded px-1.5 py-0.5 text-[11px] text-white/80 focus:outline-none focus:border-blue-500/50"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <p className="text-[11px] font-medium text-white/50 group-hover:text-white/70 transition-colors truncate">
                        {thread.title}
                      </p>
                      <p className="text-[10px] text-white/15 mt-0.5 font-mono">
                        {new Date(thread.timestamp).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </>
                  )}
                </button>
                <div className="flex items-center gap-0.5 pr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); startEdit(thread); }}
                    className="p-1 rounded-md hover:bg-white/[0.06] text-white/20 hover:text-white/50 transition-all"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(thread.id); }}
                    className="p-1 rounded-md hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {threads.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center mb-3">
            <MessageSquare className="w-5 h-5 text-white/10" />
          </div>
          <p className="text-[11px] text-white/15 leading-relaxed">
            Your research sessions will appear here.
          </p>
        </div>
      )}

      {/* Research Library button at bottom */}
      <div className="mt-auto px-3 pb-3 border-t border-white/[0.04] pt-2">
        {/* Spacer */}
      </div>
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
            className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[12px] text-blue-400 font-medium hover:bg-blue-500/15 hover:border-blue-500/30 transition-all active:scale-[0.98]"
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
                <div className="w-8 h-8 rounded-lg bg-blue-500/5 border border-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-blue-500/[0.08] transition-colors">
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

// ── Main Scout Component ────────────────────────────────

export default function Scout() {
  const { user } = useAuth();
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [reports, setReports] = useState<WorkspaceFile[]>([]);
  const [threads, setThreads] = useState<SavedThread[]>(() => loadThreads());
  const [activeThreadId, setActiveThreadId] = useState<string | null>(() => loadActiveThread());
  const threadCounter = useRef(0);

  // Sync threads to localStorage whenever they change
  useEffect(() => {
    saveThreads(threads);
  }, [threads]);

  // Sync active thread to localStorage
  useEffect(() => {
    saveActiveThread(activeThreadId);
  }, [activeThreadId]);

  // Subscribe to research files
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToFiles(user.uid, (files) => {
      setReports(files.filter((f) => f.createdBy === "scout"));
    });
    return unsub;
  }, [user]);

  // Create chat model adapter (memoized)
  const adapter = useMemo(() => createScoutAdapter(), []);
  const runtime = useLocalRuntime(adapter);

  // ── Thread Management ──────────────────────────────────

  const createThread = useCallback((query?: string) => {
    const id = generateId();
    const title = query
      ? query.length > 60
        ? query.slice(0, 57) + "..."
        : query
      : `Session ${++threadCounter.current}`;
    const newThread: SavedThread = {
      id,
      title,
      query: query || "",
      timestamp: Date.now(),
      preview: "",
    };
    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(id);
    return id;
  }, []);

  const selectThread = useCallback((id: string) => {
    setActiveThreadId(id);
    // Reload page or set the query — for now, just switch active ID
    // In a full multi-thread setup, this would reload messages from storage
  }, []);

  const deleteThread = useCallback((id: string) => {
    setThreads((prev) => prev.filter((t) => t.id !== id));
    if (activeThreadId === id) {
      setActiveThreadId(null);
    }
  }, [activeThreadId]);

  const handleQuerySelect = useCallback((query: string) => {
    // Create a new thread if none active, then set the input
    if (!activeThreadId) {
      createThread(query);
    }
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
  }, [activeThreadId, createThread]);

  const handleNewThread = useCallback(() => {
    const id = createThread();
    // Clear the input by focusing on it
    const input = document.querySelector('[role="textbox"]') as HTMLTextAreaElement;
    if (input) {
      input.focus();
    }
  }, [createThread]);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex h-full bg-zinc-900 text-white relative overflow-hidden">
        {/* Left: Thread Sidebar */}
        <ThreadSidebar
          threads={threads}
          activeId={activeThreadId}
          onSelect={selectThread}
          onDelete={deleteThread}
          onNew={handleNewThread}
        />

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
