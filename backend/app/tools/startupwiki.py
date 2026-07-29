"""StartupWiki database tools — queries live Firestore database."""

from __future__ import annotations

from typing import Any

from langchain_core.tools import tool

from app.data.firestore_client import (
    fetch_all_startups,
    fetch_startup_by_id,
    search_startups_firestore,
)


def _format_company(c: dict) -> str:
    """Format a company dict into a readable summary."""
    founders = c.get("founders") or []
    founders_str = ", ".join(f.get("name", "") for f in founders)
    funding = c.get("total_funding") or c.get("totalFunding") or 0
    stage = c.get("stage") or "N/A"
    industry = c.get("industry") or "N/A"
    desc = c.get("description") or ""
    founded = c.get("founded") or "N/A"
    hq = c.get("headquarters") or c.get("hq") or "N/A"
    return (
        f"- {c.get('name', 'Unknown')} ({stage}, {industry}): {desc}. "
        f"Founded {founded}, HQ {hq}. "
        f"Total funding: ${funding / 1_000_000:.0f}M. "
        f"Founders: {founders_str}."
    )


def _format_company_detailed(c: dict) -> str:
    """Format a company dict into a detailed profile."""
    founders = c.get("founders") or []
    founders_str = "\n".join(
        f"  • {f.get('name', '')} ({f.get('role', '')}): {f.get('background', '')}"
        for f in founders
    )
    rounds = c.get("funding_rounds") or c.get("fundingRounds") or []
    rounds_str = "\n".join(
        f"  • {r.get('round', '')}: ${float(r.get("amount", 0)) / 1_000_000:.0f}M led by {r.get('lead_investor', r.get('leadInvestor', ''))} ({r.get('date', '')})"
        for r in rounds
    )

    funding = c.get("total_funding") or c.get("totalFunding") or 0
    stage = c.get("stage") or "N/A"
    industry = c.get("industry") or "N/A"
    sub = c.get("sub_industry") or c.get("subIndustry") or "N/A"
    founded = c.get("founded") or "N/A"
    hq = c.get("headquarters") or c.get("hq") or "N/A"
    employees = c.get("employees") or c.get("employeeCount") or "N/A"
    competitors = c.get("competitors") or []
    tech = c.get("technology") or []
    strengths = c.get("strengths") or []
    risks = c.get("risks") or []

    return (
        f"COMPANY: {c.get('name', 'Unknown')}\n"
        f"Description: {c.get('long_description') or c.get('longDescription') or c.get('description', '')}\n"
        f"Industry: {industry} / {sub}\n"
        f"Stage: {stage}\n"
        f"Founded: {founded}, HQ: {hq}\n"
        f"Employees: {employees}\n"
        f"Total Funding: ${funding / 1_000_000:.0f}M\n"
        f"\nFOUNDERS:\n{founders_str}\n"
        f"\nFUNDING ROUNDS:\n{rounds_str}\n"
        f"\nCompetitors: {', '.join(competitors) if competitors else 'N/A'}\n"
        f"Technology: {', '.join(tech) if tech else 'N/A'}\n"
        f"\nStrengths: {'; '.join(strengths) if strengths else 'N/A'}\n"
        f"Risks: {'; '.join(risks) if risks else 'N/A'}"
    )


def _get_all_startups() -> list[dict[str, Any]]:
    """Get all startups from Firestore."""
    companies = fetch_all_startups()
    if not companies:
        logger = __import__("logging").getLogger(__name__)
        logger.warning("Firestore returned 0 startups — check your collection")
    return companies


def _search_startups_scored(query: str) -> list[tuple[int, dict[str, Any]]]:
    """Core search logic: returns (score, company) tuples sorted by relevance."""
    results = search_startups_firestore(query)
    # Re-score to get tuples
    query_lower = query.lower()
    words = [w for w in query_lower.split() if len(w) > 1]
    scored = []
    for c in results:
        score = 0
        name = (c.get("name") or "").lower()
        desc = (c.get("description") or "").lower()
        if query_lower in name: score += 10
        if query_lower in desc: score += 5
        for word in words:
            if word in name: score += 4
            if word in desc: score += 2
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
        all_companies = _get_all_startups()
        industries = sorted(set(
            c.get("industry", "") for c in all_companies if c.get("industry")
        ))
        names = [c.get("name", "") for c in all_companies[:5] if c.get("name")]
        return (
            f"No startups found matching '{query}'. "
            f"Try searching by industry: {', '.join(industries[:8])}. "
            f"Available companies: {', '.join(names)}."
        )

    return (
        f"Found {len(scored)} startup(s) matching '{query}':\n\n"
        + "\n".join(_format_company(c) for _, c in scored[:10])
    )


@tool
def get_company_profile(company_id: str) -> str:
    """Get the full detailed profile of a specific company by ID.

    Args:
        company_id: The unique company identifier (document ID in Firestore)
    """
    company = fetch_startup_by_id(company_id)
    if company:
        return _format_company_detailed(company)

    all_companies = _get_all_startups()
    available = ", ".join(c.get("id", "") for c in all_companies[:5])
    return f"Company '{company_id}' not found. Available IDs: {available}"


@tool
def list_all_companies() -> str:
    """List all companies currently in the StartupWiki database."""
    all_companies = _get_all_startups()
    return (
        f"All {len(all_companies)} companies in the StartupWiki database:\n\n"
        + "\n".join(_format_company(c) for c in all_companies[:20])
    )


# ── Analysis Tools ──────────────────────────────────────

@tool
def compare_companies(company_ids: str) -> str:
    """Compare multiple companies side-by-side on key metrics.

    Args:
        company_ids: Comma-separated list of company IDs
    """
    ids = [i.strip() for i in company_ids.split(",")]
    companies = [c for c in _get_all_startups() if c.get("id") in ids]

    if not companies:
        return f"No companies found for IDs: {company_ids}."

    lines = [f"# Comparison: {', '.join(c.get('name', '?') for c in companies)}\n"]
    lines.append("| Metric | " + " | ".join(c.get("name", "?") for c in companies) + " |")
    lines.append("|--------|" + "|".join(["--------" for _ in companies]) + "|")

    metrics = [
        ("Stage", "stage"),
        ("Industry", "industry"),
        ("Founded", "founded"),
        ("Employees", "employees"),
    ]
    for label, key in metrics:
        vals = [str(c.get(key, "N/A")) for c in companies]
        lines.append(f"| {label} | {' | '.join(vals)} |")

    # Funding
    funding_vals = []
    for c in companies:
        f_val = c.get("total_funding") or c.get("totalFunding") or 0
        funding_vals.append("${:.0f}M".format(f_val / 1_000_000))
    lines.append(f"| Total Funding | {' | '.join(funding_vals)} |")

    return "\n".join(lines)


@tool
def analyze_sector(industry: str) -> str:
    """Analyze an entire sector/industry — all companies, TAM, trends, top picks.

    Args:
        industry: Industry name (e.g., 'AI', 'Biotech', 'Climate')
    """
    all_companies = _get_all_startups()
    companies = [
        c for c in all_companies
        if industry.lower() in (c.get("industry") or "").lower()
        or industry.lower() in (c.get("sub_industry") or c.get("subIndustry") or "").lower()
    ]

    if not companies:
        industries = sorted(set(c.get("industry", "") for c in all_companies if c.get("industry")))
        return f"No companies found in '{industry}'. Available sectors: {', '.join(industries)}"

    funding = sum(c.get("total_funding") or c.get("totalFunding") or 0 for c in companies)

    lines = [
        f"# Sector Analysis: {industry}",
        f"Companies: {len(companies)} | Total Funding: ${funding/1_000_000:.0f}M\n",
        "## Companies\n",
    ]

    for i, c in enumerate(companies[:10], 1):
        f_val = c.get("total_funding") or c.get("totalFunding") or 0
        lines.append(
            f"{i}. **{c.get('name', 'Unknown')}** ({c.get('stage', 'N/A')})\n"
            f"   {c.get('description', '')}\n"
            f"   Funding: ${f_val/1_000_000:.0f}M | HQ: {c.get('headquarters') or c.get('hq') or 'N/A'}\n"
        )

    return "\n".join(lines)


@tool
def rank_by_metric(metric_info: str) -> str:
    """Rank all companies by a specific metric.

    Args:
        metric_info: Metric to rank by, optionally filtered by industry
                     (e.g., 'total_funding' or 'employees in Biotech')
    """
    parts = metric_info.split(" in ")
    metric = parts[0].strip()
    industry_filter = parts[1].strip() if len(parts) > 1 else None

    candidates = _get_all_startups()
    if industry_filter:
        candidates = [
            c for c in candidates
            if industry_filter.lower() in (c.get("industry") or "").lower()
        ]
        if not candidates:
            return f"No companies in '{industry_filter}'."

    # Map common names to Firestore field names
    field_map = {
        "total_funding": ["total_funding", "totalFunding"],
        "employees": ["employees", "employeeCount"],
        "founded": ["founded"],
    }

    keys = field_map.get(metric, [metric])
    ranked = sorted(
        [c for c in candidates if any(c.get(k) is not None for k in keys)],
        key=lambda c: max(c.get(k) or 0 for k in keys),
        reverse=True,
    )

    lines = [f"# Ranked by {metric}" + (f" in {industry_filter}" if industry_filter else "") + "\n"]
    for i, c in enumerate(ranked[:10], 1):
        val = max(c.get(k) or 0 for k in keys)
        if isinstance(val, (int, float)) and val >= 1_000_000:
            val_str = f"${val/1_000_000:.0f}M"
        else:
            val_str = str(val)
        lines.append(f"{i}. **{c.get('name', '?')}** — {val_str}")

    return "\n".join(lines)


@tool
def find_similar(company_id: str) -> str:
    """Find companies similar to a given company.

    Args:
        company_id: The company ID to find matches for
    """
    target = fetch_startup_by_id(company_id)
    if not target:
        return f"Company '{company_id}' not found."

    all_companies = _get_all_startups()
    similar = []
    for c in all_companies:
        if c.get("id") == company_id:
            continue
        sim = 0
        if c.get("industry") == target.get("industry"): sim += 3
        if c.get("sub_industry") == target.get("sub_industry"): sim += 2
        if c.get("stage") == target.get("stage"): sim += 2
        shared_tech = set(c.get("technology") or []) & set(target.get("technology") or [])
        sim += len(shared_tech)
        if sim > 0:
            similar.append((sim, c))

    similar.sort(key=lambda x: x[0], reverse=True)

    if not similar:
        return f"No similar companies found for {target.get('name')}."

    lines = [f"# Similar to {target.get('name')}\n"]
    for sim, c in similar[:5]:
        f_val = c.get("total_funding") or c.get("totalFunding") or 0
        lines.append(
            f"- **{c.get('name')}** (sim: {sim}) — {c.get('description', '')}\n"
            f"  {c.get('stage', '?')}, ${f_val/1_000_000:.0f}M"
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

try:
    from app.tools.serper import SERPER_TOOLS
    ALL_TOOLS.extend(SERPER_TOOLS)
except ImportError:
    pass
