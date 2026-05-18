#!/usr/bin/env python3
"""
generate_sheet_import.py

Reads opportunities_seed_records.json (the clean source of truth) and writes:
  1. opportunities_sheet_import.csv — Sheet-ready CSV with properly quoted
     multiline cells. This is the RECOMMENDED import file for Google Sheets.
  2. opportunities_seed_rows.tsv — Human-readable TSV reference (uses
     semicolons / pipes for list fields; requires Find & Replace before going live
     in Sheets — see opportunities_review.md for instructions).

Usage:
  python3 generate_sheet_import.py

Google Sheets import (option A — CSV):
  1. Open the Google Sheet.
  2. Create/select the "Opportunities" tab.
  3. File → Import → Upload → opportunities_sheet_import.csv
  4. Select "Replace current sheet" and "Detect automatically" for separator.
  5. Done — all list fields will have real in-cell newlines.

Google Sheets import (option B — TSV with Find & Replace):
  1. Paste from opportunities_seed_rows.tsv into the "Opportunities" tab.
  2. In Google Sheets: Edit → Find & Replace → check "Regular expression"
     - Replace "; " with \n in what_youll_do, who_you_are, requirements, perks columns
     - Replace " | " with \n in timeline and faq columns
  (Option A is simpler — use the CSV unless you need the TSV for a specific reason.)
"""

import csv
import json
import io
import sys

HEADER = [
    "id","title","type","role_types","hub","description","commitment",
    "commitment_type","is_paid","compensation","status","deadline","season",
    "featured","plx_program","apply_url","learn_more_url","order",
    "hero_image","long_description","what_youll_do","who_you_are",
    "requirements","perks","timeline","faq","contact_email",
]


def bool_str(v):
    if isinstance(v, bool):
        return "TRUE" if v else "FALSE"
    s = str(v).strip().upper()
    return s if s in ("TRUE","FALSE") else s


def lines_to_cell(v):
    """Array → newline-separated string for in-cell list fields."""
    if isinstance(v, list):
        return "\n".join(str(x).strip() for x in v if str(x).strip())
    return str(v or "").strip()


def timeline_to_cell(v):
    """Array of {label, detail} → 'Label :: Detail' per line."""
    if isinstance(v, list):
        parts = []
        for item in v:
            if isinstance(item, dict):
                lbl = str(item.get("label","")).strip()
                det = str(item.get("detail","")).strip()
                parts.append(f"{lbl} :: {det}" if det else lbl)
            else:
                parts.append(str(item).strip())
        return "\n".join(p for p in parts if p)
    return str(v or "").strip()


def faq_to_cell(v):
    """Array of {q, a} → 'Q :: A' per line."""
    if isinstance(v, list):
        parts = []
        for item in v:
            if isinstance(item, dict):
                q = str(item.get("q","")).strip()
                a = str(item.get("a","")).strip()
                parts.append(f"{q} :: {a}" if a else q)
            else:
                parts.append(str(item).strip())
        return "\n".join(p for p in parts if p)
    return str(v or "").strip()


def record_to_row(r):
    return [
        str(r.get("id","")),
        str(r.get("title","")),
        str(r.get("type","")),
        str(r.get("role_types","")),
        str(r.get("hub","")),
        str(r.get("description","")),
        str(r.get("commitment","")),
        str(r.get("commitment_type","")),
        bool_str(r.get("is_paid","")),
        str(r.get("compensation","")),
        str(r.get("status","")),
        str(r.get("deadline","")),
        str(r.get("season","")),
        bool_str(r.get("featured","")),
        str(r.get("plx_program","")),
        str(r.get("apply_url","")),
        str(r.get("learn_more_url","")),
        str(r.get("order","")),
        str(r.get("hero_image","")),
        str(r.get("long_description","")),
        lines_to_cell(r.get("what_youll_do",[])),
        lines_to_cell(r.get("who_you_are",[])),
        lines_to_cell(r.get("requirements",[])),
        lines_to_cell(r.get("perks",[])),
        timeline_to_cell(r.get("timeline",[])),
        faq_to_cell(r.get("faq",[])),
        str(r.get("contact_email","")),
    ]


with open("opportunities_seed_records.json") as f:
    records = json.load(f)

# ── 1. Write Sheet-ready CSV (quoted multiline cells) ─────────────────────────
with open("opportunities_sheet_import.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f, quoting=csv.QUOTE_ALL)
    writer.writerow(HEADER)
    for r in records:
        writer.writerow(record_to_row(r))

print(f"opportunities_sheet_import.csv  ({len(records)+1} rows incl. header)")

# ── 2. Write human-readable TSV (semicolons / pipes for list fields) ──────────
def lines_to_tsv(v):
    """Array → semicolon-separated string for TSV readability."""
    if isinstance(v, list):
        return "; ".join(str(x).strip() for x in v if str(x).strip())
    return str(v or "").strip()


def timeline_to_tsv(v):
    if isinstance(v, list):
        parts = []
        for item in v:
            if isinstance(item, dict):
                lbl = str(item.get("label","")).strip()
                det = str(item.get("detail","")).strip()
                parts.append(f"{lbl} :: {det}" if det else lbl)
            else:
                parts.append(str(item).strip())
        return " | ".join(p for p in parts if p)
    return str(v or "").strip()


def faq_to_tsv(v):
    if isinstance(v, list):
        parts = []
        for item in v:
            if isinstance(item, dict):
                q = str(item.get("q","")).strip()
                a = str(item.get("a","")).strip()
                parts.append(f"{q} :: {a}" if a else q)
            else:
                parts.append(str(item).strip())
        return " | ".join(p for p in parts if p)
    return str(v or "").strip()


def record_to_tsv_row(r):
    return [
        str(r.get("id","")),
        str(r.get("title","")),
        str(r.get("type","")),
        str(r.get("role_types","")),
        str(r.get("hub","")),
        str(r.get("description","")),
        str(r.get("commitment","")),
        str(r.get("commitment_type","")),
        bool_str(r.get("is_paid","")),
        str(r.get("compensation","")),
        str(r.get("status","")),
        str(r.get("deadline","")),
        str(r.get("season","")),
        bool_str(r.get("featured","")),
        str(r.get("plx_program","")),
        str(r.get("apply_url","")),
        str(r.get("learn_more_url","")),
        str(r.get("order","")),
        str(r.get("hero_image","")),
        str(r.get("long_description","")).replace("\n","\\n"),
        lines_to_tsv(r.get("what_youll_do",[])),
        lines_to_tsv(r.get("who_you_are",[])),
        lines_to_tsv(r.get("requirements",[])),
        lines_to_tsv(r.get("perks",[])),
        timeline_to_tsv(r.get("timeline",[])),
        faq_to_tsv(r.get("faq",[])),
        str(r.get("contact_email","")),
    ]


with open("opportunities_seed_rows.tsv", "w", encoding="utf-8") as f:
    f.write("\t".join(HEADER) + "\n")
    for r in records:
        f.write("\t".join(record_to_tsv_row(r)) + "\n")

print(f"opportunities_seed_rows.tsv     ({len(records)+1} rows incl. header)")
print()
print(f"Total records: {len(records)}")
