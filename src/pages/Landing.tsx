import { useState, useEffect, useRef } from "react";
import {
  LogIn,
  Sparkles,
  Bot,
  Globe,
  TrendingUp,
  Search,
  FileText,
  Shield,
  Star,
  Menu,
  X,
  ArrowRight,
  Zap,
  Layers,
  Terminal,
  DollarSign,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// ── Feature data ─────────────────────────────────────

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
}

const features: Feature[] = [
  {
    icon: Search,
    title: "AI-Powered Company Research",
    description:
      "Generate comprehensive investment memos on any startup with one query. AI agents research funding, team, market, and competitive landscape.",
    gradient: "from-violet-500/20 to-purple-500/5",
  },
  {
    icon: Globe,
    title: "Real-Time Market Intel",
    description:
      "Track funding rounds, founder moves, and emerging trends across 10+ sectors. Get alerted before your competitors do.",
    gradient: "from-blue-500/20 to-cyan-500/5",
  },
  {
    icon: TrendingUp,
    title: "Smart Portfolio Tracking",
    description:
      "Monitor your portfolio companies with automated briefings. Surface risks, opportunities, and follow-on investment signals.",
    gradient: "from-emerald-500/20 to-teal-500/5",
  },
  {
    icon: Bot,
    title: "Multi-Agent Orchestration",
    description:
      "Specialized AI agents collaborate to research, analyze, and synthesize. Manager agents route work to research, briefing, and analyst agents.",
    gradient: "from-amber-500/20 to-orange-500/5",
  },
  {
    icon: FileText,
    title: "Auto-Generated Briefings",
    description:
      "One-click company briefings with executive summaries, competitive analysis, market positioning, and AI-generated investment thesis.",
    gradient: "from-rose-500/20 to-pink-500/5",
  },
  {
    icon: Shield,
    title: "Deal Flow Intelligence",
    description:
      "Score and rank opportunities with AI-driven signals. Never miss a unicorn with automated screening across thousands of startups.",
    gradient: "from-indigo-500/20 to-violet-500/5",
  },
];

// ── Terminal Mockup ──────────────────────────────────

const terminalLines = [
  { text: "> scouting neural-labs — AI infrastructure for science", delay: 0, type: "command" as const },
  { text: "", delay: 0, type: "empty" as const },
  { text: "┌─ Research Agent ──────────────────────────────┐", delay: 400, type: "output" as const },
  { text: "│                                               │", delay: 500, type: "output" as const },
  { text: "│  Neural Labs                                  │", delay: 600, type: "output" as const },
  { text: "│  Stage: Seed  |  Founded: 2023  |  SF, CA    │", delay: 700, type: "output" as const },
  { text: "│  Total Funding: $10M                          │", delay: 800, type: "output" as const },
  { text: "│  Employees: 24                                │", delay: 900, type: "output" as const },
  { text: "│                                               │", delay: 1000, type: "output" as const },
  { text: "│  ── Founding Team ──                          │", delay: 1100, type: "output" as const },
  { text: "│  Dr. Sarah Chen — CEO (ex-DeepMind)           │", delay: 1200, type: "output" as const },
  { text: "│  Marcus Rivera — CTO (ex-NVIDIA)              │", delay: 1300, type: "output" as const },
  { text: "│                                               │", delay: 1400, type: "output" as const },
  { text: "│  ── AI Insight ──                             │", delay: 1500, type: "output" as const },
  { text: "│  Strong buy signal. Deep tech moat in         │", delay: 1600, type: "output" as const },
  { text: "│  distributed training. Team pedigree is       │", delay: 1700, type: "output" as const },
  { text: "│  exceptionally rare. Targeting $50B market.   │", delay: 1800, type: "output" as const },
  { text: "│                                               │", delay: 1900, type: "output" as const },
  { text: "└───────────────────────────────────────────────┘", delay: 2000, type: "output" as const },
  { text: "", delay: 2100, type: "empty" as const },
  { text: "> Analysis complete. Briefing ready. ✓", delay: 2200, type: "success" as const },
];

function TerminalPreview() {
  const [visibleLines, setVisibleLines] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);
  const mountedRef = useRef(true);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const startAnimation = () => {
    // Clear previous timers
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setVisibleLines(0);

    terminalLines.forEach((line, i) => {
      const t = setTimeout(() => {
        if (!mountedRef.current) return;
        setVisibleLines((v) => Math.max(v, i + 1));
      }, line.delay + 300);
      timersRef.current.push(t);
    });

    // Loop after all lines shown
    const lastDelay = terminalLines[terminalLines.length - 1].delay + 4000;
    const loopT = setTimeout(() => {
      if (!mountedRef.current) return;
      startAnimation();
    }, lastDelay);
    timersRef.current.push(loopT);
  };

  useEffect(() => {
    mountedRef.current = true;
    startAnimation();

    // Blinking cursor
    const cursorTimer = setInterval(() => {
      if (!mountedRef.current) return;
      setCursorVisible((v) => !v);
    }, 530);

    return () => {
      mountedRef.current = false;
      timersRef.current.forEach(clearTimeout);
      clearInterval(cursorTimer);
    };
  }, []);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Terminal window chrome */}
      <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden shadow-2xl shadow-accent-500/5">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-900 border-b border-gray-800">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-[11px] text-gray-500 font-mono ml-3">Terminal — startupwiki v0.1.0</span>
          <div className="ml-auto flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] text-emerald-400/70 font-mono">AI • NVIDIA NIM</span>
          </div>
        </div>

        {/* Terminal content */}
        <div className="p-4 font-mono text-[12px] leading-relaxed h-[340px] overflow-hidden">
          {terminalLines.slice(0, visibleLines).map((line, i) => {
            if (line.type === "empty") return <div key={i} className="h-[1.2em]" />;
            if (line.type === "command") {
              return (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="text-emerald-400">$</span>
                  <span className="text-gray-100">{line.text.replace("> ", "")}</span>
                  {i === visibleLines - 1 && (
                    <span
                      className={`inline-block w-2 h-4 bg-gray-100 ml-0.5 ${cursorVisible ? "opacity-100" : "opacity-0"}`}
                    />
                  )}
                </div>
              );
            }
            if (line.type === "success") {
              return (
                <div key={i} className="flex items-center gap-1.5 text-emerald-400">
                  <span>{line.text}</span>
                </div>
              );
            }
            // output
            return (
              <div key={i} className="text-gray-400 whitespace-pre">
                {line.text}
              </div>
            );
          })}
        </div>
      </div>

      {/* Glow effect */}
      <div className="absolute -inset-4 bg-accent-500/5 rounded-3xl blur-3xl -z-10" />
    </div>
  );
}

// ── Animated gradient background ────────────────────

function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-[#0d0e10]" />

      {/* Animated orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-accent-500/8 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: "8s" }} />
      <div className="absolute top-[40%] right-[-15%] w-[50%] h-[50%] bg-violet-600/6 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: "12s", animationDelay: "1s" }} />
      <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: "10s", animationDelay: "2s" }} />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Subtle radial gradient in center */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(94,106,210,0.03)_0%,transparent_70%)]" />
    </div>
  );
}

// ── Stats ───────────────────────────────────────────

const stats = [
  { value: "10K+", label: "Startups analyzed", icon: Search },
  { value: "$2B+", label: "Deal flow tracked", icon: DollarSign },
  { value: "50+", label: "Sectors monitored", icon: Globe },
  { value: "99.9%", label: "Uptime", icon: Shield },
];

// ── How it works ────────────────────────────────────

const steps = [
  {
    number: "01",
    title: "Ask a question",
    description: "Type any startup, market, or trend you want to research. Natural language — no complex queries needed.",
    icon: Terminal,
  },
  {
    number: "02",
    title: "AI agents research",
    description: "AI agents automatically gather data, analyze markets, evaluate teams, and generate insights.",
    icon: Bot,
  },
  {
    number: "03",
    title: "Get your briefing",
    description: "Receive a comprehensive investment memo with executive summary, competitive analysis, and AI-driven thesis.",
    icon: FileText,
  },
];

// ── Landing Component ───────────────────────────────

export default function Landing() {
  const { signIn } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSignIn = () => {
    signIn();
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0d0e10] text-gray-100 overflow-x-hidden">
      <AnimatedBackground />

      {/* ── Navigation ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-gray-950/80 backdrop-blur-lg border-b border-gray-800/50" : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-accent-500/20 border border-accent-500/30 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-accent-400" />
              </div>
              <span className="text-sm font-semibold text-gray-0 font-mono">StartupWiki</span>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection("features")} className="text-[13px] text-gray-400 hover:text-gray-100 transition-colors font-mono">
                Features
              </button>
              <button onClick={() => scrollToSection("how-it-works")} className="text-[13px] text-gray-400 hover:text-gray-100 transition-colors font-mono">
                How it works
              </button>
              <button onClick={() => scrollToSection("terminal")} className="text-[13px] text-gray-400 hover:text-gray-100 transition-colors font-mono">
                Terminal
              </button>
              <button
                onClick={handleSignIn}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg text-[13px] font-semibold hover:bg-gray-100 transition-all hover:scale-[1.02] active:scale-[0.98] font-mono"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign in
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-gray-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-800 bg-gray-950/95 backdrop-blur-lg">
            <div className="px-4 py-4 space-y-3">
              <button onClick={() => scrollToSection("features")} className="block w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-gray-100 rounded-lg hover:bg-gray-800 transition-colors font-mono">
                Features
              </button>
              <button onClick={() => scrollToSection("how-it-works")} className="block w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-gray-100 rounded-lg hover:bg-gray-800 transition-colors font-mono">
                How it works
              </button>
              <button onClick={() => scrollToSection("terminal")} className="block w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-gray-100 rounded-lg hover:bg-gray-800 transition-colors font-mono">
                Terminal
              </button>
              <button
                onClick={handleSignIn}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-gray-900 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors font-mono mt-2"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign in with Google
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-500/10 border border-accent-500/20 text-accent-300 text-[11px] font-mono mb-6 animate-fade-in">
            <Zap className="w-3 h-3" />
            Powered by AI + NVIDIA NIM
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-0 leading-[1.1] tracking-tight mb-5 animate-slide-up">
            AI-Powered{" "}
            <span className="bg-gradient-to-r from-accent-300 via-accent-400 to-violet-400 bg-clip-text text-transparent">
              Venture Capital
            </span>{" "}
            Intelligence
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed mb-8 font-mono animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Research any startup, generate investment memos, and track entire markets — all with specialized AI agents
            that work together in real time.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <button
              onClick={handleSignIn}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-white text-gray-900 rounded-xl text-[15px] font-semibold hover:bg-gray-100 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-white/5 font-mono w-full sm:w-auto justify-center"
            >
              <LogIn className="w-4 h-4" />
              Sign in with Google
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={() => scrollToSection("terminal")}
              className="inline-flex items-center gap-2 px-6 py-3.5 border border-gray-700 text-gray-300 rounded-xl text-[15px] font-medium hover:bg-gray-800/50 transition-all font-mono w-full sm:w-auto justify-center"
            >
              <Terminal className="w-4 h-4" />
              See it in action
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-3xl mx-auto">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center animate-slide-up" style={{ animationDelay: "0.3s" }}>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-0 font-mono">{stat.value}</div>
                  <div className="text-[11px] text-gray-500 mt-1 font-mono flex items-center justify-center gap-1">
                    <Icon className="w-3 h-3" />
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Terminal Preview ── */}
      <section id="terminal" className="relative px-4 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-0 mb-3 font-mono">See it in action</h2>
            <p className="text-sm text-gray-500 font-mono">
              One query generates a complete investment briefing — team analysis, market positioning, and AI-driven insights.
            </p>
          </div>
          <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <TerminalPreview />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative px-4 pb-24">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-500/10 border border-accent-500/20 text-accent-300 text-[11px] font-mono mb-4">
              <Star className="w-3 h-3" />
              Everything you need
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-0 mb-3">
              Your personal{" "}
              <span className="bg-gradient-to-r from-accent-300 to-violet-400 bg-clip-text text-transparent">
                VC analyst team
              </span>
            </h2>
            <p className="text-sm text-gray-500 max-w-xl mx-auto font-mono">
              Six specialized AI agents work together to research, analyze, and brief you on any opportunity.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group relative bg-gray-900/50 border border-gray-800/80 rounded-xl p-5 hover:border-gray-700 transition-all duration-300 hover:bg-gray-900/80 hover:shadow-lg hover:shadow-accent-500/5 animate-slide-up"
                  style={{ animationDelay: `${0.05 * i}s` }}
                >
                  {/* Gradient overlay on hover */}
                  <div
                    className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${feature.gradient}`}
                  />

                  <div className="relative z-10">
                    <div className="w-10 h-10 rounded-lg bg-accent-500/10 border border-accent-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-5 h-5 text-accent-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-100 mb-1.5">{feature.title}</h3>
                    <p className="text-[12px] text-gray-500 leading-relaxed font-mono">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="relative px-4 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono mb-4">
              <Layers className="w-3 h-3" />
              Simple workflow
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-0 mb-3">Three steps to intelligence</h2>
            <p className="text-sm text-gray-500 max-w-xl mx-auto font-mono">
              No training required. Ask a question, let the agents work, get your answer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line (desktop only) */}
            <div className="hidden md:block absolute top-12 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-accent-500/40 via-accent-500/20 to-transparent" />

            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="text-center animate-slide-up" style={{ animationDelay: `${0.1 * i}s` }}>
                  <div className="w-20 h-20 rounded-2xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center mx-auto mb-5 relative group-hover:scale-110 transition-transform">
                    <Icon className="w-8 h-8 text-accent-400" />
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-accent-500/20 border border-accent-500/30 flex items-center justify-center">
                      <span className="text-[11px] font-bold text-accent-300 font-mono">{step.number}</span>
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-100 mb-2">{step.title}</h3>
                  <p className="text-[12px] text-gray-500 leading-relaxed font-mono max-w-xs mx-auto">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative px-4 pb-32">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-8 sm:p-12 shadow-xl">
            <div className="w-14 h-14 rounded-xl bg-accent-500/20 border border-accent-500/30 flex items-center justify-center mx-auto mb-5">
              <Sparkles className="w-7 h-7 text-accent-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-0 mb-3">
              Ready to research smarter?
            </h2>
            <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto font-mono">
              Join thousands of investors using AI-powered intelligence to find their next deal.
            </p>
            <button
              onClick={handleSignIn}
              className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-white text-gray-900 rounded-xl text-[15px] font-semibold hover:bg-gray-100 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-white/5 font-mono"
            >
              <LogIn className="w-4 h-4" />
              Get started free
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-800/50 px-4 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-accent-500/20 border border-accent-500/30 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-accent-400" />
            </div>
            <span className="text-xs text-gray-500 font-mono">StartupWiki Terminal</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-[11px] text-gray-600 font-mono">AI + NVIDIA NIM</span>
            <span className="text-[11px] text-gray-600 font-mono">© 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
