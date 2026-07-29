"""Memo Builder Pipeline — constructs professional VC investment memos.

Breaks the memo into section-specific helpers for maintainability and
testability. Used by both the research agent (multi-company) and the
briefing agent (single-company deep dive).
"""

from __future__ import annotations

from typing import Any

from app.data.mock_db import STARTUPS
from app.pipelines.scoring import calculate_vc_score

# ── Serper snippet helpers ──────────────────────────────


def _summarize_snippets(results_text: str, fallback: str) -> str:
    """Extract key snippets from Serper results for the memo."""
    if not results_text or "[Web search unavailable" in results_text or "[News search unavailable" in results_text:
        return f"*{fallback}*"

    lines = results_text.strip().split("\n")
    snippets = []
    for line in lines:
        stripped = line.strip()
        if stripped and stripped[0].isdigit() and ". " in stripped[:4]:
            after_num = stripped.split(". ", 1)[1] if ". " in stripped else stripped
            title = after_num.strip("*").strip()
            if title:
                snippets.append(f"- {title}")

    if not snippets:
        return results_text[:500]

    return "\n".join(snippets[:5])


# ── Section builders ────────────────────────────────────


def build_executive_summary(company: dict[str, Any] | None, company_name: str, query: str) -> str:
    """Build the Executive Summary section."""
    if not company:
        return f"**{company_name}** — insufficient data for a full analysis. Try searching our database or enabling Serper API for live web research."

    scores = calculate_vc_score(company)
    strengths = company.get("strengths", [])
    description = company.get("description", "")
    stage = company.get("stage", "N/A")
    industry = company.get("industry", "N/A")
    founded = company.get("founded", "N/A")
    hq = company.get("headquarters", "N/A")
    employees = company.get("employees", "N/A")
    total_funding = company.get("total_funding", 0)

    return f"""{description if description else f"{company_name} is a {stage}-stage {industry} company founded in {founded}, headquartered in {hq}."}

**Stage:** {stage} | **Industry:** {industry} | **Founded:** {founded} | **HQ:** {hq}
**Employees:** {employees} | **Total Raised:** ${total_funding/1_000_000:.0f}M

**VC Score:** {scores['overall_score']}/10 — {scores['rating']}
**Key Differentiator:** {strengths[0] if strengths else 'Under analysis'}

*Query: "{query}"*"""


def build_market_section(company: dict[str, Any] | None, market_results: str) -> str:
    """Build the Market Dynamics section."""
    if not company:
        return "**Market data:** Search the database for companies in this sector."

    tam = company.get("market_size_billions", "N/A")
    moat = company.get("moat_score", "N/A")
    competitors = company.get("competitors", [])
    tech = company.get("technology", [])
    industry = company.get("industry", "")
    sub = company.get("sub_industry", "")

    comp_text = f"**Key Competitors:** {', '.join(competitors)}" if competitors else ""
    tech_text = f"**Technology Stack:** {', '.join(tech)}" if tech else ""

    return f"""**Industry:** {industry} / {sub}
**TAM:** ${tam}B | **Moat Score:** {moat}/10
{comp_text}
{tech_text}

**Live Market Intelligence:**
{_summarize_snippets(market_results, "Set SERPER_API_KEY for live TAM/growth analysis")}"""


def build_team_section(company: dict[str, Any] | None, web_results: str) -> str:
    """Build the Team Assessment section."""
    if not company:
        return "**Team data:** Not available."

    founders = company.get("founders", [])
    if not founders:
        return "**Team:** No founder data in database."

    lines = ["**Founders:**"]
    for f in founders:
        lines.append(f"- **{f['name']}** ({f.get('role', '')})")
        lines.append(f"  {f.get('background', '')}")
        prev = f.get("previous_companies", [])
        if prev:
            lines.append(f"  Previous: {', '.join(prev)}")

    strengths = company.get("strengths", [])
    fmf = strengths[1] if len(strengths) > 1 else "Analyze founder backgrounds for domain expertise"

    return f"""{chr(10).join(lines)}

**Founder-Market Fit:** {fmf}

**Live Background Search:**
{_summarize_snippets(web_results, 'Set SERPER_API_KEY to search founder backgrounds')}"""


def build_funding_section(company: dict[str, Any] | None, news_results: str) -> str:
    """Build the Deal Dynamics & Traction section."""
    if not company:
        return "**Funding:** No data available."

    total_funding = company.get("total_funding", 0)
    rounds = company.get("funding_rounds", [])
    valuation = company.get("valuation_est", "N/A")
    revenue = company.get("revenue_range", "N/A")
    growth = company.get("growth_rate_yoy", "N/A")
    employees = company.get("employees", "N/A")
    hq = company.get("headquarters", "N/A")
    investor_tier = company.get("investor_quality_tier", 3)
    exit_path = company.get("exit_potential", "N/A")

    tier_labels = {1: "Tier 1 (top-tier)", 2: "Tier 2 (strong)", 3: "Tier 3 (emerging)"}

    lines = [
        f"**Total Raised:** ${total_funding/1_000_000:.0f}M | **Valuation Est:** ${valuation/1_000_000:.0f}M" if isinstance(valuation, (int, float)) else f"**Total Raised:** ${total_funding/1_000_000:.0f}M | **Valuation:** {valuation}",
        f"**Revenue:** {revenue} | **YoY Growth:** {growth}% | **Employees:** {employees} | **HQ:** {hq}",
        f"**Investor Quality:** {tier_labels.get(investor_tier, 'Unknown')}",
        f"**Exit Potential:** {exit_path}",
    ]

    if rounds:
        lines.append("\n**Funding History:**")
        for r in rounds:
            investors = ", ".join(r.get("investors", []))
            lines.append(f"- **{r['round']}**: ${r['amount']/1_000_000:.0f}M led by {r['lead_investor']} ({r['date']}) — also: {investors}")

    lines.append(f"\n**Recent News & Milestones:**\n{_summarize_snippets(news_results, 'Set SERPER_API_KEY for live news')}")

    return "\n".join(lines)


def build_thesis_section(company: dict[str, Any] | None) -> str:
    """Build the Investment Thesis section."""
    if not company:
        return "**Thesis:** Insufficient data for conviction."

    strengths = company.get("strengths", [])
    risks = company.get("risks", [])
    scores = calculate_vc_score(company)

    strengths_text = "\n".join(f"- {s}" for s in strengths) if strengths else "- [Analysis pending]"
    risks_text = "\n".join(f"- {r}" for r in risks) if risks else "- [Analysis pending]"

    recommendation = "MONITOR"
    overall = scores["overall_score"]
    stage = company.get("stage", "")
    # Early-stage + high score = highest conviction
    if overall >= 7.5 and stage in ("Pre-seed", "Seed", "Series A"):
        recommendation = "HIGH CONVICTION BUY"
    elif overall >= 7.0:
        recommendation = "BUY"
    elif overall >= 5.0:
        recommendation = "MONITOR"
    else:
        recommendation = "PASS"

    reason = strengths[0][:120] if strengths else f"Overall VC Score: {overall}/10"

    return f"""### Bull Case
{strengths_text}

### Key Risks
{risks_text}

### VC Scorecard
| Dimension | Score | Notes |
|-----------|-------|-------|
| Team | {scores['team_score']}/10 | {scores.get('investor_quality', '')} |
| Market | {scores['market_score']}/10 | TAM: ${company.get('market_size_billions', 'N/A')}B |
| Traction | {scores['traction_score']}/10 | Growth: {company.get('growth_rate_yoy', 'N/A')}% YoY |
| **Overall** | **{scores['overall_score']}/10** | {scores['rating']} |

### Recommendation
**{recommendation}** — {reason}"""


# ── Full memo builder ───────────────────────────────────


def build_full_memo(
    company: dict[str, Any] | None,
    company_name: str,
    web_results: str = "",
    news_results: str = "",
    market_results: str = "",
    query: str = "",
) -> str:
    """Build a complete VC investment memo from gathered data."""
    from datetime import datetime, timezone

    now = datetime.now(timezone.utc).strftime("%B %d, %Y")

    return f"""# {company_name} — VC Investment Memo

*Generated: {now} | Source: StartupWiki Database + Live Web Search*

---

## 1. Executive Summary

{build_executive_summary(company, company_name, query)}

---

## 2. Market Dynamics

{build_market_section(company, market_results)}

---

## 3. Team Assessment

{build_team_section(company, web_results)}

---

## 4. Deal Dynamics & Traction

{build_funding_section(company, news_results)}

---

## 5. Investment Thesis

{build_thesis_section(company)}

---

*Database contains {len(STARTUPS)} pre-vetted startups. Set `SERPER_API_KEY` for live web research (free tier at https://serper.dev).*"""
