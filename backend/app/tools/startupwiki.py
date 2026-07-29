"""StartupWiki database tools — LangChain-compatible tools with 20+ VC-vetted startups.

Now includes:
- search_startups, get_company_profile, list_all_companies (original)
- compare_companies, analyze_sector, rank_by_metric, find_similar (new)
"""

from __future__ import annotations

from typing import Any

from langchain_core.tools import tool

from app.data.mock_db import STARTUPS
from app.pipelines.scoring import calculate_vc_score, score_multiple


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
    """Format a company dict into a detailed profile with VC scores."""
    scores = calculate_vc_score(c)
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
        f"Valuation Est: ${c.get('valuation_est', 'N/A')}\n"
        f"Revenue: {c.get('revenue_range', 'N/A')}\n"
        f"YoY Growth: {c.get('growth_rate_yoy', 'N/A')}%\n"
        f"TAM: ${c.get('market_size_billions', 'N/A')}B\n"
        f"Last Funding: {c['last_funding_date']}\n"
        f"\nFOUNDERS:\n{founders_str}\n"
        f"\nFUNDING ROUNDS:\n{rounds_str}\n"
        f"\nCompetitors: {', '.join(c['competitors'])}\n"
        f"Technology: {', '.join(c['technology'])}\n"
        f"\nVC SCORECARD:\n"
        f"  Team: {scores['team_score']}/10\n"
        f"  Market: {scores['market_score']}/10\n"
        f"  Traction: {scores['traction_score']}/10\n"
        f"  Overall: {scores['overall_score']}/10 — {scores['rating']}\n"
        f"\nStrengths: {'; '.join(c['strengths'])}\n"
        f"Risks: {'; '.join(c['risks'])}\n"
        f"Exit Potential: {c.get('exit_potential', 'N/A')}"
    )


def _search_startups_scored(query: str) -> list[tuple[int, dict[str, Any]]]:
    """Core search logic: returns (score, company) tuples sorted by relevance."""
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

        if query_lower in name: score += 10
        if query_lower in desc: score += 5

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


# ── Core Search Tools ────────────────────────────────────

@tool
def search_startups(query: str) -> str:
    """Search the StartupWiki database for startups matching a query.

    Performs multi-word matching across name, description, industry, tags,
    technology, founders, and headquarters. Returns formatted summaries
    sorted by relevance.

    Args:
        query: Search keywords (company name, industry, technology, etc.)
    """
    scored = _search_startups_scored(query)

    if not scored:
        industries = sorted(set(c["industry"] for c in STARTUPS))
        return (
            f"No startups found matching '{query}'. "
            f"Try searching by industry: {', '.join(industries)}. "
            f"Available companies: {', '.join(c['name'] for c in STARTUPS[:5])}."
        )

    return (
        f"Found {len(scored)} startup(s) matching '{query}':\n\n"
        + "\n".join(_format_company(c) for _, c in scored[:10])
    )


@tool
def get_company_profile(company_id: str) -> str:
    """Get the full detailed profile of a specific company by ID.

    Includes VC scorecard with Team/Market/Traction scores out of 10.

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


# ── Analysis Tools ──────────────────────────────────────

@tool
def compare_companies(company_ids: str) -> str:
    """Compare multiple companies side-by-side on key VC metrics.

    Args:
        company_ids: Comma-separated list of company IDs (e.g., 'neural-labs,robosynth')
    """
    ids = [i.strip() for i in company_ids.split(",")]
    companies = [c for c in STARTUPS if c["id"] in ids]

    if not companies:
        return f"No companies found for IDs: {company_ids}. Available: {', '.join(c['id'] for c in STARTUPS[:5])}"

    lines = [f"# Side-by-Side Comparison: {', '.join(c['name'] for c in companies)}\n"]
    lines.append("| Metric | " + " | ".join(c["name"] for c in companies) + " |")
    lines.append("|--------|" + "|".join(["--------" for _ in companies]) + "|")
    lines.append(f"| Stage | {' | '.join(c['stage'] for c in companies)} |")
    lines.append(f"| Industry | {' | '.join(c['industry'] for c in companies)} |")
    lines.append(f"| Founded | {' | '.join(str(c['founded']) for c in companies)} |")
    lines.append(f"| Employees | {' | '.join(str(c['employees']) for c in companies)} |")
    lines.append(f"| Total Funding | {' | '.join('${:.0f}M'.format(c['total_funding']/1_000_000) for c in companies)} |")
    lines.append(f"| Valuation Est | {' | '.join('${:.0f}M'.format(c['valuation_est']/1_000_000) if isinstance(c.get('valuation_est'), (int, float)) else str(c.get('valuation_est', 'N/A')) for c in companies)} |")
    lines.append("| YoY Growth | " + " | ".join("{}%".format(c.get('growth_rate_yoy', 'N/A')) for c in companies) + " |")
    lines.append("| TAM | " + " | ".join("${}B".format(c.get('market_size_billions', 'N/A')) for c in companies) + " |")
    lines.append("| Moat Score | " + " | ".join("{}/10".format(c.get('moat_score', 'N/A')) for c in companies) + " |")

    # VC Scores
    for c in companies:
        c["_scores"] = calculate_vc_score(c)
    lines.append("| VC Overall | " + " | ".join("{}/10".format(c['_scores']['overall_score']) for c in companies) + " |")
    lines.append("| Team Score | " + " | ".join("{}/10".format(c['_scores']['team_score']) for c in companies) + " |")
    lines.append("| Market Score | " + " | ".join("{}/10".format(c['_scores']['market_score']) for c in companies) + " |")
    lines.append("| Traction Score | " + " | ".join("{}/10".format(c['_scores']['traction_score']) for c in companies) + " |")

    return "\n".join(lines)


@tool
def analyze_sector(industry: str) -> str:
    """Analyze an entire sector/industry — all companies, TAM, trends, and top picks.

    Args:
        industry: Industry name (e.g., 'AI & Machine Learning', 'Biotech', 'Climate Tech')
    """
    companies = [c for c in STARTUPS if industry.lower() in c["industry"].lower() or industry.lower() in c.get("sub_industry", "").lower()]

    if not companies:
        available = sorted(set(c["industry"] for c in STARTUPS))
        return f"No companies found in '{industry}'. Available sectors: {', '.join(available)}"

    # Score and rank
    scored = score_multiple(companies)

    total_tam = sum(c.get("market_size_billions", 0) for c in companies)
    total_funding = sum(c["total_funding"] for c in companies)
    avg_growth = sum(c.get("growth_rate_yoy", 0) for c in companies) / len(companies) if companies else 0

    lines = [
        f"# Sector Analysis: {industry}",
        f"Companies: {len(companies)} | Total TAM: ${total_tam:.0f}B | Total Funding: ${total_funding/1_000_000:.0f}M | Avg Growth: {avg_growth:.0f}%\n",
        "## Top-Ranked Companies\n",
    ]

    for i, c in enumerate(scored[:5], 1):
        s = c.get("vc_scores", {})
        lines.append(
            f"{i}. **{c['name']}** (VC Score: {s.get('overall_score', 'N/A')}/10)\n"
            f"   {c['description']}\n"
            f"   Stage: {c['stage']} | Funding: ${c['total_funding']/1_000_000:.0f}M | "
            f"Growth: {c.get('growth_rate_yoy', 'N/A')}% | TAM: ${c.get('market_size_billions', 'N/A')}B\n"
        )

    if len(scored) > 5:
        lines.append(f"\n...and {len(scored) - 5} more companies. Use `compare_companies` for side-by-side analysis.")

    return "\n".join(lines)


@tool
def rank_by_metric(metric_info: str) -> str:
    """Rank all companies by a specific VC metric.

    Args:
        metric_info: Metric to rank by, optionally filtered by industry
                     (e.g., 'growth_rate_yoy' or 'market_size_billions in Biotech')
    """
    parts = metric_info.split(" in ")
    metric = parts[0].strip()
    industry_filter = parts[1].strip() if len(parts) > 1 else None

    valid_metrics = {
        "growth_rate_yoy": "YoY Growth Rate",
        "market_size_billions": "Market Size (TAM)",
        "total_funding": "Total Funding",
        "moat_score": "Moat Score",
        "valuation_est": "Valuation Estimate",
    }

    if metric not in valid_metrics:
        return f"Unknown metric '{metric}'. Available: {', '.join(valid_metrics.keys())}"

    candidates = STARTUPS
    if industry_filter:
        candidates = [c for c in STARTUPS if industry_filter.lower() in c["industry"].lower() or industry_filter.lower() in c.get("sub_industry", "").lower()]
        if not candidates:
            return f"No companies found in '{industry_filter}'."

    key = metric
    ranked = sorted(
        [c for c in candidates if c.get(key) is not None],
        key=lambda c: c.get(key, 0),
        reverse=True,
    )

    lines = [f"# Companies Ranked by {valid_metrics[metric]}"]
    if industry_filter:
        lines[0] += f" in {industry_filter}"
    lines.append("")

    for i, c in enumerate(ranked[:10], 1):
        val = c.get(key, "N/A")
        if isinstance(val, (int, float)) and key in ("total_funding", "valuation_est"):
            val_str = f"${val/1_000_000:.0f}M"
        elif isinstance(val, (int, float)) and key == "market_size_billions":
            val_str = f"${val:.0f}B"
        elif isinstance(val, (int, float)):
            val_str = f"{val}%"
        else:
            val_str = str(val)
        lines.append(f"{i}. **{c['name']}** — {val_str} ({c['stage']}, {c['industry']})")

    return "\n".join(lines)


@tool
def find_similar(company_id: str) -> str:
    """Find companies similar to a given company (same industry, similar stage, shared technology).

    Args:
        company_id: The company ID to find matches for (e.g., 'neural-labs')
    """
    target = None
    for c in STARTUPS:
        if c["id"] == company_id:
            target = c
            break

    if not target:
        available = ", ".join(c["id"] for c in STARTUPS[:5])
        return f"Company '{company_id}' not found. Available IDs: {available}"

    # Score similarity
    similar = []
    for c in STARTUPS:
        if c["id"] == company_id:
            continue
        sim = 0
        if c["industry"] == target["industry"]: sim += 3
        if c.get("sub_industry") == target.get("sub_industry"): sim += 2
        if c["stage"] == target["stage"]: sim += 2
        shared_tech = set(c.get("technology", [])) & set(target.get("technology", []))
        sim += len(shared_tech)
        shared_tags = set(c.get("tags", [])) & set(target.get("tags", []))
        sim += len(shared_tags)
        if sim > 0:
            similar.append((sim, c))

    similar.sort(key=lambda x: x[0], reverse=True)

    if not similar:
        return f"No similar companies found for {target['name']}. Try searching by industry: {target['industry']}."

    lines = [
        f"# Companies Similar to {target['name']}",
        f"Industry: {target['industry']} / {target.get('sub_industry', '')} | Stage: {target['stage']}\n",
    ]

    for sim, c in similar[:5]:
        lines.append(
            f"- **{c['name']}** (similarity: {sim}) — {c['description']}\n"
            f"  {c['stage']}, {c['industry']}, ${c['total_funding']/1_000_000:.0f}M raised"
        )

    return "\n".join(lines)


# Tool registries
RESEARCH_TOOLS = [
    search_startups,
    get_company_profile,
    list_all_companies,
    compare_companies,
    analyze_sector,
    rank_by_metric,
    find_similar,
]

ALL_TOOLS = list(RESEARCH_TOOLS)

# Include Serper tools when available
try:
    from app.tools.serper import SERPER_TOOLS
    ALL_TOOLS.extend(SERPER_TOOLS)
except ImportError:
    pass
