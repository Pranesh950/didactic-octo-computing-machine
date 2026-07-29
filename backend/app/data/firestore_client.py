"""Firestore client — connects to the startup database via Firebase Admin SDK.

Collection: "startups" — each document is a startup company profile.
"""

from __future__ import annotations

import os
import glob
import logging
from typing import Any

import firebase_admin
from firebase_admin import credentials, firestore

logger = logging.getLogger(__name__)

# Find the service account key file in the project root
_key_files = glob.glob("*-firebase-adminsdk-*.json")
if not _key_files:
    _key_files = glob.glob("../*-firebase-adminsdk-*.json")

_cred = None
_db = None

if _key_files:
    _key_path = _key_files[0]
    try:
        _cred = credentials.Certificate(_key_path)
        _app = firebase_admin.initialize_app(_cred)
        _db = firestore.client()
        logger.info("Firestore connected via key: %s", os.path.basename(_key_path))
    except Exception as e:
        logger.warning("Firestore init failed: %s. Using empty database.", e)
else:
    logger.warning("No service account key found. Set FIRESTORE_EMULATOR_HOST for local dev or add a key file.")


def get_db() -> firestore.Client | None:
    """Get the Firestore client. Returns None if not initialized."""
    return _db


def get_startups_collection():
    """Get the 'startups' collection reference."""
    db = get_db()
    if db is None:
        return None
    return db.collection("startups")


def fetch_all_startups() -> list[dict[str, Any]]:
    """Fetch all startup documents from Firestore."""
    col = get_startups_collection()
    if col is None:
        return []

    docs = col.stream()
    results = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        results.append(data)
    return results


def fetch_startup_by_id(company_id: str) -> dict[str, Any] | None:
    """Fetch a single startup by document ID."""
    col = get_startups_collection()
    if col is None:
        return None

    doc = col.document(company_id).get()
    if doc.exists:
        data = doc.to_dict()
        data["id"] = doc.id
        return data
    return None


def search_startups_firestore(query: str) -> list[dict[str, Any]]:
    """Search startups in Firestore by name, description, industry, and tags.

    Firestore doesn't support full-text search natively, so we fetch all
    and filter in Python. For large collections, consider using Algolia
    or Firebase's text search extensions.
    """
    all_companies = fetch_all_startups()
    if not all_companies:
        return []

    query_lower = query.lower()
    words = [w for w in query_lower.split() if len(w) > 1]

    scored = []
    for c in all_companies:
        score = 0
        name = (c.get("name") or "").lower()
        desc = (c.get("description") or "").lower()
        industry = (c.get("industry") or "").lower()
        tags = " ".join(c.get("tags") or []).lower()
        tech = " ".join(c.get("technology") or []).lower()
        founders = " ".join(
            f.get("name", "").lower() for f in (c.get("founders") or [])
        )

        if query_lower in name: score += 10
        if query_lower in desc: score += 5

        for word in words:
            if word in name: score += 4
            if word in desc: score += 2
            if word in industry: score += 3
            if word in tags: score += 2
            if word in tech: score += 2
            if word in founders: score += 1

        if score > 0:
            scored.append((score, c))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [c for _, c in scored]
