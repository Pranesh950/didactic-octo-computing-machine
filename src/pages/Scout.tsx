import { useState, useCallback, useRef, useEffect } from "react";
import {
  Send,
  CheckCircle2,
  Circle,
  Loader2,
  Crosshair,
  FileText,
  Sparkles,
  PanelRightOpen,
  PanelRightClose,
  Save,
  User,
  Bot,
  Copy,
} from "lucide-react";
import Badge from "@/components/shared/Badge";
import { cn } from "@/lib/utils";
import { runAgentStream } from "@/lib/backend-client";
import { addFile } from "@/data/workspace";
import { useAuth } from "@/contexts/AuthContext";

type StepStatus = "pending" | "running" | "complete";

interface AgentStep {
  id: string;
  label: string;
  status: StepStatus;
}

const defaultSteps: AgentStep[] = [
  { id: "routing", label: "Manager routing intent to sub-agent", status: "pending" },
  { id: "researching", label: "Research agent searching database", status: "pending" },
  { id: "analyzing", label: "Analyzing companies and market data", status: "pending" },
  { id: "synthesizing", label: "Manager synthesizing findings", status: "pending" },
];

interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: string;
  savedToWorkspace?: boolean;
}

const suggestions = [
  "Find promising AI robotics startups founded by researchers from top labs",
  "Map the synthetic biology landscape for companies using generative AI",
  "Identify early-stage climate tech startups with strong technical moats",
  "Find AI agent companies building autonomous workflow infrastructure",
];

export default function Scout() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<AgentStep[]>(defaultSteps);
  const [liveContent, setLiveContent] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [workspaceOpen, setWorkspaceOpen] = useState(true);
  const [savedFileId, setSavedFileId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const workspaceScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, liveContent]);

  // Auto-scroll workspace
  useEffect(() => {
    if (liveContent && workspaceScrollRef.current) {
      workspaceScrollRef.current.scrollTop = workspaceScrollRef.current.scrollHeight;
    }
  }, [liveContent]);

  const handleRun = useCallback(async () => {
    if (!query.trim() || isRunning) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toISOString(),
    };

    setIsRunning(true);
    setError(null);
    setLiveContent("");
    setSavedFileId(null);
    setMessages((prev) => [...prev, userMsg]);
    setSteps(defaultSteps.map((s) => ({ ...s, status: "pending" })));
    setWorkspaceOpen(true);

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

    const currentQuery = query;
    setQuery("");

    try {
      const result = await runAgentStream(currentQuery, undefined, {
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
          setLiveContent(finalContent);

          const agentMsg: ChatMessage = {
            id: `msg-${Date.now()}-agent`,
            role: "agent",
            content: finalContent,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, agentMsg]);
          setSteps((prev) => prev.map((s) => ({ ...s, status: "complete" as StepStatus })));

          // Auto-save to workspace
          const file = await addFile(user!.uid, {
            title: currentQuery.slice(0, 60) + (currentQuery.length > 60 ? "…" : ""),
            type: "research_report",
            content: finalContent,
            createdBy: "scout",
            sourceQuery: currentQuery,
            modelUsed: final.model_used,
          });
          setSavedFileId(file?.id ?? null);

          // Mark the message as saved so the button shows "Saved"
          setMessages((prev) =>
            prev.map((m) =>
              m.id === agentMsg.id ? { ...m, savedToWorkspace: true } : m,
            ),
          );
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
  }, [query, isRunning, user]);

  const handleSaveToWorkspace = useCallback(async (msg: ChatMessage) => {
    if (msg.savedToWorkspace || !user) return;
    const file = await addFile(user.uid, {
      title: msg.content.slice(0, 60) + (msg.content.length > 60 ? "…" : ""),
      type: "research_report",
      content: msg.content,
      createdBy: "scout",
    });
    setSavedFileId(file?.id ?? null);
    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, savedToWorkspace: true } : m)),
    );
  }, [user]);

  return (
    <div className="flex h-full">
      {/* ── Left: Chat conversation ── */}
      <div className={cn("flex flex-col min-w-0 bg-[#0d0e10] transition-all", workspaceOpen ? "flex-1 border-r border-gray-800" : "flex-1")}>
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-800 bg-[#0b0c0e] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Crosshair className="w-4 h-4 text-accent-400" />
            <h2 className="text-[15px] font-semibold text-gray-0">Scout</h2>
            <div className="flex items-center gap-1 ml-2">
              <Sparkles className="w-3 h-3 text-accent-400" />
              <span className="text-[10px] text-accent-400 font-mono">LangGraph</span>
            </div>
          </div>
          {!workspaceOpen && (
            <button
              onClick={() => setWorkspaceOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] text-gray-500 hover:text-gray-300 hover:bg-gray-900 transition-colors font-mono"
            >
              <PanelRightOpen className="w-3.5 h-3.5" />
              Open workspace
            </button>
          )}
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto">
          {/* Empty state */}
          {messages.length === 0 && !isRunning && (
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <Bot className="w-4 h-4 text-accent-400" />
                <p className="text-[12px] text-gray-400 font-mono">Scout is ready. Try a research query:</p>
              </div>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(s)}
                  className="block w-full text-left p-3 bg-gray-900 border border-gray-800 rounded-lg text-[13px] text-gray-400 hover:border-accent-500/30 hover:text-gray-200 transition-all font-mono"
                >
                  <span className="text-accent-400 mr-2">→</span>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <div key={msg.id} className={cn("px-6 py-4", msg.role === "agent" && "bg-gray-950/30 border-y border-gray-800/50")}>
              <div className="max-w-3xl mx-auto">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5",
                    msg.role === "user" ? "bg-accent-500/20" : "bg-emerald-500/20",
                  )}>
                    {msg.role === "user"
                      ? <User className="w-3.5 h-3.5 text-accent-400" />
                      : <Bot className="w-3.5 h-3.5 text-emerald-400" />
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-semibold text-gray-400 font-mono">
                        {msg.role === "user" ? "You" : "Scout Agent"}
                      </span>
                      <span className="text-[10px] text-gray-600 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-[13px] text-gray-300 leading-relaxed whitespace-pre-wrap font-mono">
                      {msg.content}
                    </div>
                    {msg.role === "agent" && (
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-800/50">
                        {msg.savedToWorkspace ? (
                          <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Saved to workspace
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSaveToWorkspace(msg)}
                            className="text-[10px] text-gray-500 hover:text-accent-400 font-mono flex items-center gap-1 transition-colors"
                          >
                            <Save className="w-3 h-3" />
                            Save to workspace
                          </button>
                        )}
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(msg.content);
                          }}
                          className="text-[10px] text-gray-500 hover:text-gray-400 font-mono flex items-center gap-1 transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          Copy
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Streaming indicator */}
          {isRunning && (
            <div className="px-6 py-4 bg-gray-950/30 border-y border-gray-800/50">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-semibold text-emerald-400 font-mono">Scout Agent</span>
                      <span className="text-[10px] text-gray-600 font-mono">writing…</span>
                    </div>
                    {liveContent ? (
                      <div className="text-[13px] text-gray-300 leading-relaxed whitespace-pre-wrap font-mono">
                        {liveContent}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-[12px] text-gray-500 font-mono">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Thinking…
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="px-6 py-4">
              <div className="max-w-3xl mx-auto bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                <p className="text-[12px] text-red-400 font-mono">{error}</p>
                <p className="text-[11px] text-gray-500 mt-1 font-mono">
                  Ensure backend is running: <code className="text-accent-400">cd backend && uvicorn app.main:app --reload</code>
                </p>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-800 bg-[#0b0c0e]">
          <div className="flex gap-2 max-w-3xl mx-auto">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRun()}
              placeholder="Ask Scout to research…"
              className="flex-1 px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-md text-[13px] text-gray-0 focus:border-gray-600 focus:ring-2 focus:ring-accent-500/10 transition-all placeholder:text-gray-600 font-mono"
              disabled={isRunning}
            />
            <button
              onClick={handleRun}
              disabled={!query.trim() || isRunning}
              className="px-4 py-2.5 bg-accent-500 text-white rounded-md text-[13px] font-medium hover:bg-accent-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-mono"
            >
              {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Send
            </button>
          </div>
        </div>
      </div>

      {/* ── Right: Collapsible Live Workspace Panel ── */}
      {workspaceOpen && (
        <div className="w-[420px] flex-shrink-0 flex flex-col bg-[#0b0c0e] border-l border-gray-800">
          {/* Workspace header */}
          <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-accent-400" />
              <span className="text-[12px] font-semibold text-gray-300 font-mono uppercase tracking-wider">
                Live Workspace
              </span>
              {(isRunning || liveContent) && (
                <div className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse ml-1" />
              )}
            </div>
            <button
              onClick={() => setWorkspaceOpen(false)}
              className="p-1 rounded hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors"
              title="Close workspace"
            >
              <PanelRightClose className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Workspace content */}
          <div className="flex-1 overflow-y-auto" ref={workspaceScrollRef}>
            {!isRunning && !liveContent && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <FileText className="w-8 h-8 text-gray-700 mb-3" />
                <p className="text-[12px] text-gray-500 font-mono">
                  Ask Scout a question to see the agent work live in this panel
                </p>
                <p className="text-[11px] text-gray-600 mt-1 font-mono">
                  Files are auto-saved to your workspace
                </p>
              </div>
            )}

            {/* Agent steps (when running) */}
            {isRunning && (
              <div className="p-4 border-b border-gray-800">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 font-mono">
                  Agent Pipeline
                </p>
                <div className="space-y-1">
                  {steps.map((step) => (
                    <div
                      key={step.id}
                      className={cn(
                        "flex items-center gap-2 py-1 px-2 rounded transition-colors text-[11px]",
                        step.status === "running" && "text-accent-300 bg-accent-500/5",
                        step.status === "complete" && "text-gray-400",
                        step.status === "pending" && "text-gray-600",
                      )}
                    >
                      {step.status === "complete" && <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />}
                      {step.status === "running" && <Loader2 className="w-3 h-3 text-accent-400 animate-spin flex-shrink-0" />}
                      {step.status === "pending" && <Circle className="w-3 h-3 text-gray-700 flex-shrink-0" />}
                      <span className="font-mono">{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live document */}
            {(isRunning || liveContent) && (
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded bg-accent-500/15 border border-accent-500/25 flex items-center justify-center">
                    <FileText className="w-3 h-3 text-accent-400" />
                  </div>
                  <div>
                    <p className="text-[12px] font-medium text-gray-200 font-mono truncate">
                      {messages[messages.length - 1]?.role === "user"
                        ? (messages[messages.length - 1]?.content.slice(0, 50) ?? "Research")
                        : "Research Report"}
                    </p>
                    <p className="text-[10px] text-gray-500 font-mono">
                      {isRunning ? "Writing…" : "Complete"}
                    </p>
                  </div>
                  {savedFileId && (
                    <Badge variant="success">Saved</Badge>
                  )}
                </div>
                <div className="bg-gray-950 border border-gray-800 rounded-lg p-4 text-[12px] text-gray-300 font-mono whitespace-pre-wrap leading-relaxed min-h-[200px] max-h-[calc(100vh-280px)] overflow-y-auto">
                  {liveContent || (
                    <span className="text-gray-600 italic">Waiting for agent output…</span>
                  )}
                  {isRunning && (
                    <span className="inline-block w-2 h-4 bg-accent-400 animate-pulse ml-0.5 align-middle" />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
