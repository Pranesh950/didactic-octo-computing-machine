"""StartupWiki database tools — LangChain-compatible tools wrapping the mock database."""

from __future__ import annotations

from typing import Any

from langchain_core.tools import tool

# ── Mock database (mirrors frontend mock.ts) ──────────────

STARTUPS: list[dict[str, Any]] = [
    {
        "id": "neural-labs",
        "name": "Neural Labs",
        "description": "AI infrastructure for scientific discovery",
        "long_description": "Neural Labs builds foundational AI infrastructure that accelerates scientific research. Their platform enables research labs to train and deploy large-scale models for drug discovery, materials science, and genomics without needing dedicated ML engineering teams.",
        "industry": "AI & Machine Learning",
        "sub_industry": "AI Infrastructure",
        "stage": "Seed",
        "founded": 2023,
        "headquarters": "San Francisco, CA",
        "employees": 24,
        "total_funding": 8_000_000,
        "last_funding_date": "2024-11-15",
        "founders": [
            {
                "name": "Dr. Sarah Chen",
                "role": "CEO & Co-Founder",
                "background": "PhD in Computational Biology from Stanford. Former Research Scientist at DeepMind where she led the protein folding infrastructure team.",
                "previous_companies": ["DeepMind", "Stanford Bioengineering"],
            },
            {
                "name": "Marcus Rivera",
                "role": "CTO & Co-Founder",
                "background": "Previously Staff Engineer at NVIDIA working on distributed training systems. Built infrastructure serving 10,000+ GPUs.",
                "previous_companies": ["NVIDIA", "Google Cloud"],
            },
        ],
        "funding_rounds": [
            {"round": "Seed", "amount": 8_000_000, "date": "2024-11-15", "lead_investor": "Andreessen Horowitz", "investors": ["Andreessen Horowitz", "Sequoia Capital", "Floodgate"]},
            {"round": "Pre-seed", "amount": 2_000_000, "date": "2023-06-01", "lead_investor": "Floodgate", "investors": ["Floodgate", "Y Combinator"]},
        ],
        "competitors": ["Weights & Biases", "Modular", "Anyscale"],
        "technology": ["Distributed Training", "GPU Orchestration", "MLOps", "AutoML"],
        "tags": ["AI Infrastructure", "Scientific Computing", "Deep Tech"],
        "growth_signal": "high",
        "strengths": ["Deep tech moat in distributed training optimization", "Founding team with unmatched domain expertise", "Early traction with top-10 pharma companies"],
        "risks": ["Enterprise sales cycles in pharma are 12-18 months", "Competing with well-funded open source alternatives", "GPU supply chain dependency"],
    },
    {
        "id": "robosynth",
        "name": "RoboSynth",
        "description": "General-purpose robotics foundation models",
        "long_description": "RoboSynth develops foundational AI models for robotic manipulation. Their models enable any robot arm to learn complex manipulation tasks from natural language instructions, dramatically reducing the cost of deploying robots in manufacturing and logistics.",
        "industry": "Robotics",
        "sub_industry": "Robotics Software",
        "stage": "Series A",
        "founded": 2022,
        "headquarters": "Boston, MA",
        "employees": 56,
        "total_funding": 32_000_000,
        "last_funding_date": "2025-02-20",
        "founders": [
            {
                "name": "Dr. James Park",
                "role": "CEO",
                "background": "PhD in Robotics from MIT. Former Research Lead at Boston Dynamics where he led manipulation research. 15+ publications in top robotics conferences.",
                "previous_companies": ["Boston Dynamics", "MIT CSAIL"],
            },
        ],
        "funding_rounds": [
            {"round": "Series A", "amount": 24_000_000, "date": "2025-02-20", "lead_investor": "Lux Capital", "investors": ["Lux Capital", "Founders Fund", "Khosla Ventures"]},
            {"round": "Seed", "amount": 8_000_000, "date": "2023-09-10", "lead_investor": "Khosla Ventures", "investors": ["Khosla Ventures", "Y Combinator", "SV Angel"]},
        ],
        "competitors": ["Physical Intelligence", "Skild AI", "Covariant"],
        "technology": ["Foundation Models", "Imitation Learning", "Sim-to-Real Transfer", "Robot Control"],
        "tags": ["Robotics", "Foundation Models", "Manufacturing"],
        "growth_signal": "high",
        "strengths": ["Pioneering foundation model approach for robotics", "Strong IP portfolio with 8 patents filed", "Pilot deployments with 3 Fortune 500 manufacturers"],
        "risks": ["Hardware-dependent deployment limits scalability", "Safety certification for industrial use is expensive", "Competition from well-funded Physical Intelligence ($400M raise)"],
    },
    {
        "id": "synthex-bio",
        "name": "Synthex Bio",
        "description": "Programmable cell therapies using AI-designed proteins",
        "long_description": "Synthex Bio combines generative AI with synthetic biology to design novel therapeutic proteins. Their platform generates and tests millions of protein variants in silico, reducing the time to identify clinical candidates from years to months.",
        "industry": "Biotech",
        "sub_industry": "AI Drug Discovery",
        "stage": "Series A",
        "founded": 2021,
        "headquarters": "Cambridge, MA",
        "employees": 72,
        "total_funding": 45_000_000,
        "last_funding_date": "2025-01-08",
        "founders": [
            {
                "name": "Dr. Elena Vasquez",
                "role": "CEO & Co-Founder",
                "background": "MD/PhD from Harvard-MIT. Former Principal Scientist at Moderna where she led the mRNA design platform. Rhodes Scholar.",
                "previous_companies": ["Moderna", "Broad Institute"],
            },
            {
                "name": "Prof. David Kim",
                "role": "Chief Scientific Officer",
                "background": "Professor of Bioengineering at Stanford. Pioneer in computational protein design. 200+ publications, 15 patents.",
                "previous_companies": ["Stanford University"],
            },
        ],
        "funding_rounds": [
            {"round": "Series A", "amount": 35_000_000, "date": "2025-01-08", "lead_investor": "ARCH Venture Partners", "investors": ["ARCH Venture Partners", "F-Prime Capital", "GV"]},
            {"round": "Seed", "amount": 10_000_000, "date": "2023-03-15", "lead_investor": "GV", "investors": ["GV", "Khosla Ventures"]},
        ],
        "competitors": ["Generate Biomedicines", "Evozyne", "Profluent"],
        "technology": ["Protein Design", "Generative AI", "High-Throughput Screening", "mRNA"],
        "tags": ["Biotech", "AI Drug Discovery", "Deep Tech", "Protein Engineering"],
        "growth_signal": "high",
        "strengths": ["Validated platform with 3 internal programs in lead optimization", "World-class founding team with rare combination of AI + biology expertise", "Strong pharma partnership interest with 2 term sheets received"],
        "risks": ["Clinical validation still 18-24 months away", "Regulatory uncertainty around AI-designed biologics", "Talent war for ML engineers who understand biology"],
    },
    {
        "id": "solara-climate",
        "name": "Solara Climate",
        "description": "Direct air capture with AI-optimized materials",
        "long_description": "Solara Climate develops next-generation direct air capture (DAC) systems powered by AI-discovered sorbent materials. Their machine learning platform has identified novel materials that capture CO2 at 40% lower energy cost than existing solutions.",
        "industry": "Climate Tech",
        "sub_industry": "Carbon Capture",
        "stage": "Series B",
        "founded": 2020,
        "headquarters": "Oakland, CA",
        "employees": 94,
        "total_funding": 85_000_000,
        "last_funding_date": "2025-04-01",
        "founders": [
            {
                "name": "Amir Patel",
                "role": "CEO",
                "background": "Former VP of Engineering at Tesla Energy. Led the Powerwall manufacturing scale-up from prototype to 100K+ units.",
                "previous_companies": ["Tesla", "SunPower"],
            },
        ],
        "funding_rounds": [
            {"round": "Series B", "amount": 55_000_000, "date": "2025-04-01", "lead_investor": "Breakthrough Energy Ventures", "investors": ["Breakthrough Energy Ventures", "Lowercarbon Capital", "Prelude Ventures"]},
            {"round": "Series A", "amount": 20_000_000, "date": "2023-08-01", "lead_investor": "Lowercarbon Capital", "investors": ["Lowercarbon Capital", "Prelude Ventures"]},
            {"round": "Seed", "amount": 10_000_000, "date": "2021-12-01", "lead_investor": "Prelude Ventures", "investors": ["Prelude Ventures", "Y Combinator"]},
        ],
        "competitors": ["Climeworks", "Carbon Engineering", "Heirloom"],
        "technology": ["Direct Air Capture", "Materials Science", "ML-Driven Discovery", "Process Engineering"],
        "tags": ["Climate Tech", "Carbon Capture", "Deep Tech", "Sustainability"],
        "growth_signal": "medium",
        "strengths": ["Proprietary sorbent materials with 40% cost advantage", "First commercial pilot producing 1,000 tons/year", "Strong policy tailwinds from IRA and EU carbon markets"],
        "risks": ["Capital-intensive deployment model", "Carbon credit prices are volatile", "Competing with nature-based solutions on cost per ton"],
    },
    {
        "id": "tesseract-finance",
        "name": "Tesseract Finance",
        "description": "AI-native quantitative hedge fund infrastructure",
        "long_description": "Tesseract Finance provides the infrastructure layer for AI-native quantitative trading. Their platform enables hedge funds and asset managers to deploy machine learning models directly to production trading environments with institutional-grade risk controls and compliance.",
        "industry": "Fintech",
        "sub_industry": "Quantitative Finance",
        "stage": "Seed",
        "founded": 2024,
        "headquarters": "New York, NY",
        "employees": 18,
        "total_funding": 6_000_000,
        "last_funding_date": "2024-10-01",
        "founders": [
            {
                "name": "Alex Zhang",
                "role": "CEO",
                "background": "Former Quantitative Trader at Jane Street. Built systematic trading strategies managing $2B AUM. CS degree from MIT.",
                "previous_companies": ["Jane Street", "Two Sigma"],
            },
            {
                "name": "Priya Sharma",
                "role": "CTO",
                "background": "Staff Engineer at Stripe building financial infrastructure. Previously at Goldman Sachs electronic trading.",
                "previous_companies": ["Stripe", "Goldman Sachs"],
            },
        ],
        "funding_rounds": [
            {"round": "Seed", "amount": 6_000_000, "date": "2024-10-01", "lead_investor": "Founders Fund", "investors": ["Founders Fund", "Ribbit Capital", "BoxGroup"]},
        ],
        "competitors": ["Numerai", "QuantConnect", "Alpaca"],
        "technology": ["ML Trading", "Risk Management", "Backtesting", "Market Data Pipelines"],
        "tags": ["Fintech", "Quantitative Finance", "AI/ML"],
        "growth_signal": "high",
        "strengths": ["Exceptional founding team with top-tier trading + infra experience", "Already processing $500M+ in monthly trading volume from beta customers", "Regulatory compliance built in from day one"],
        "risks": ["Fintech regulatory landscape is complex and evolving", "Customer concentration risk with first 3 hedge fund clients", "AI model explainability requirements from regulators"],
    },
    {
        "id": "genesis-data",
        "name": "Genesis Data",
        "description": "Synthetic data generation for enterprise AI training",
        "long_description": "Genesis Data generates high-fidelity synthetic datasets for training enterprise AI models. Their platform creates statistically accurate, privacy-preserving synthetic data that eliminates the bottleneck of real-world data scarcity in regulated industries.",
        "industry": "AI & Machine Learning",
        "sub_industry": "Synthetic Data",
        "stage": "Seed",
        "founded": 2023,
        "headquarters": "Austin, TX",
        "employees": 15,
        "total_funding": 5_500_000,
        "last_funding_date": "2024-09-15",
        "founders": [
            {
                "name": "Rachel Okafor",
                "role": "CEO",
                "background": "Former ML Engineer at Scale AI. Built data pipelines processing 10M+ annotations daily. MS in CS from CMU.",
                "previous_companies": ["Scale AI", "Palantir"],
            },
        ],
        "funding_rounds": [
            {"round": "Seed", "amount": 5_500_000, "date": "2024-09-15", "lead_investor": "General Catalyst", "investors": ["General Catalyst", "Y Combinator", "Liquid 2 Ventures"]},
        ],
        "competitors": ["Gretel", "Mostly AI", "Tonic.ai"],
        "technology": ["Synthetic Data", "Generative Models", "Privacy Engineering", "Data Quality"],
        "tags": ["AI Infrastructure", "Enterprise", "Data"],
        "growth_signal": "medium",
        "strengths": ["Strong enterprise pipeline with 2 F500 pilot customers", "Differentiated privacy guarantees with formal verification", "Modular architecture integrates with existing data pipelines"],
        "risks": ["Synthetic data quality skepticism in regulated industries", "Fierce competition from established players like Gretel", "Long enterprise sales cycles for new data infrastructure"],
    },
]


def _format_company(c: dict) -> str:
    """Format a company dict into a readable summary."""
    founders_str = ", ".join(f["name"] for f in c["founders"])
    return (
        f"- {c['name']} ({c['stage']}, {c['industry']}): {c['description']}. "
        f"Founded {c['founded']}, HQ {c['headquarters']}. "
        f"Total funding: ${c['total_funding'] / 1_000_000:.0f}M. "
        f"Founders: {founders_str}."
    )


def _format_company_detailed(c: dict) -> str:
    """Format a company dict into a detailed profile."""
    founders_str = "\n".join(
        f"  • {f['name']} ({f['role']}): {f['background']}"
        for f in c["founders"]
    )
    rounds_str = "\n".join(
        f"  • {r['round']}: ${r['amount'] / 1_000_000:.0f}M led by {r['lead_investor']} ({r['date']})"
        for r in c["funding_rounds"]
    )
    return (
        f"COMPANY: {c['name']}\n"
        f"Description: {c['long_description']}\n"
        f"Industry: {c['industry']} / {c['sub_industry']}\n"
        f"Stage: {c['stage']}\n"
        f"Founded: {c['founded']}, HQ: {c['headquarters']}\n"
        f"Employees: {c['employees']}\n"
        f"Total Funding: ${c['total_funding'] / 1_000_000:.0f}M\n"
        f"Last Funding: {c['last_funding_date']}\n"
        f"Growth Signal: {c['growth_signal']}\n"
        f"\nFOUNDERS:\n{founders_str}\n"
        f"\nFUNDING ROUNDS:\n{rounds_str}\n"
        f"\nCompetitors: {', '.join(c['competitors'])}\n"
        f"Technology: {', '.join(c['technology'])}\n"
        f"\nStrengths: {'; '.join(c['strengths'])}\n"
        f"Risks: {'; '.join(c['risks'])}"
    )


# ── Shared search helper ─────────────────────────────────
# Used by both the LangChain tool AND agent fallback code so
# search always works regardless of LLM availability.


def _search_startups_scored(query: str) -> list[tuple[int, dict[str, Any]]]:
    """Core search logic: returns (score, company) tuples sorted by relevance.

    Searches across name, description, industry, sub_industry, tags,
    technology, founders, and headquarters using multi-word matching.
    """
    query_lower = query.lower()
    words = [w for w in query_lower.split() if len(w) > 1]

    scored: list[tuple[int, dict[str, Any]]] = []
    for c in STARTUPS:
        score = 0
        name = c["name"].lower()
        desc = c["description"].lower()
        industry = c["industry"].lower()
        tags = " ".join(c.get("tags", [])).lower()
        tech = " ".join(c.get("technology", [])).lower()
        sub = c.get("sub_industry", "").lower()
        founders = " ".join(f["name"].lower() for f in c.get("founders", []))

        # Full phrase match (highest weight)
        if query_lower in name:
            score += 10
        if query_lower in desc:
            score += 5

        # Per-word matching
        for word in words:
            if word in name: score += 4
            if word in desc: score += 2
            if word in industry: score += 3
            if word in sub: score += 3
            if word in tags: score += 2
            if word in tech: score += 2
            if word in founders: score += 1
            if word in c.get("headquarters", "").lower(): score += 1

        if score > 0:
            scored.append((score, c))

    scored.sort(key=lambda x: x[0], reverse=True)
    return scored


# ── LangChain Tools ──────────────────────────────────────

@tool
def search_startups(query: str) -> str:
    """Search the StartupWiki database for startups matching a query.

    Performs multi-word matching across name, description, industry, tags,
    and technology. Returns formatted summaries sorted by relevance.

    Args:
        query: Search keywords (company name, industry, technology, etc.)
    """
    scored = _search_startups_scored(query)

    if not scored:
        industries = sorted(set(c["industry"] for c in STARTUPS))
        return (
            f"No startups found matching '{query}'. "
            f"Try searching by industry: {', '.join(industries)}. "
            f"Or use a company name like: {', '.join(c['name'] for c in STARTUPS[:3])}."
        )

    return (
        f"Found {len(scored)} startup(s) matching '{query}':\n\n"
        + "\n".join(_format_company(c) for _, c in scored[:8])
    )


@tool
def get_company_profile(company_id: str) -> str:
    """Get the full detailed profile of a specific company by ID.

    Args:
        company_id: The unique company identifier (e.g., 'neural-labs')
    """
    for c in STARTUPS:
        if c["id"] == company_id:
            return _format_company_detailed(c)

    available = ", ".join(c["id"] for c in STARTUPS)
    return f"Company '{company_id}' not found. Available IDs: {available}"


@tool
def list_all_companies() -> str:
    """List all companies currently in the StartupWiki database."""
    return (
        f"All {len(STARTUPS)} companies in the StartupWiki database:\n\n"
        + "\n".join(_format_company(c) for c in STARTUPS)
    )


# Tool registry for LangGraph agents
RESEARCH_TOOLS = [search_startups, get_company_profile, list_all_companies]
ALL_TOOLS = RESEARCH_TOOLS
