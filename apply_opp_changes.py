#!/usr/bin/env python3
"""
apply_opp_changes.py

Applies all strategic changes to opportunities_seed_records.json:
  1. Adds 4 new Ecuador/Quito records
  2. Revises existing records to invite Ecuador administrators
  3. Strengthens non-cash incentive / compensation framing
  4. Fixes "Applications Open" timeline labels on coming_soon records
  5. Fixes remaining travel overpromises in apprentice perks
  6. Fixes ED FAQ "annual international expedition travel" overpromise

Run from the repo root:
  python3 apply_opp_changes.py

Writes to opportunities_seed_records.json (in-place update).
"""

import json, copy

with open("opportunities_seed_records.json") as f:
    records = json.load(f)

# ─── Helper ────────────────────────────────────────────────────────────────

def find(rec_id):
    for r in records:
        if r["id"] == rec_id:
            return r
    raise KeyError(f"Record not found: {rec_id}")


# ═══════════════════════════════════════════════════════════════════════════
# SECTION 1 — Fix existing records
# ═══════════════════════════════════════════════════════════════════════════

# ── 1a. executive-director: fix FAQ "annual international expedition travel" ──
ed = find("executive-director")
ed["faq"] = [
    {"q": "Is the salary posted?",
     "a": "We share the range directly with qualified applicants. Write to jobs@dramaticadventure.com to learn more."},
    {"q": "Does DAT have a Board?",
     "a": "Yes. The ED reports to the Board and works closely with the Artistic Director."},
    {"q": "Is this truly remote?",
     "a": "Core team is distributed. In-person presence is expected for key organizational moments and field work. "
          "Field travel may be available when aligned with program needs and funding; "
          "travel is discussed before engagement and is not a substitute for agreed compensation."},
]

# ── 1b. development-partnerships-lead: add Ecuador pathway ──────────────────
dpl = find("development-partnerships-lead")
dpl["long_description"] = (
    dpl["long_description"].rstrip()
    + "\n\nEcuador-based candidates, especially those based in Quito, are strongly encouraged to express interest. "
    "Bilingual Spanish/English candidates are especially welcome. "
    "This role may connect directly to DAT's Ecuador hub-building work, "
    "including ACTion, Drama Club, and local sponsor cultivation."
)
dpl["perks"] = [
    "Compensation commensurate with experience (salary or contract)",
    "Meaningful mission with direct creative proximity",
    "Remote-first",
    "Access to DAT's global alumni and artistic network",
    "Direct mentorship from DAT's Artistic Director and senior leadership",
    "Priority consideration for expanded roles as DAT grows",
    "Field travel may be available when aligned with program needs and funding; travel is discussed before engagement and is not a substitute for agreed compensation",
]

# ── 1c. managing-producer: fix timeline "Applications Open" ─────────────────
mp = find("managing-producer")
mp["timeline"] = [
    {"label": "Expressions of Interest", "detail": "Open now — write to jobs@dramaticadventure.com"},
    {"label": "Target Start", "detail": "Fall 2026"},
]

# ── 1d. communications-story-lead: fix timeline + add bilingual note ─────────
csl = find("communications-story-lead")
csl["timeline"] = [
    {"label": "Expressions of Interest", "detail": "Open now — write to jobs@dramaticadventure.com"},
    {"label": "Target Start", "detail": "Fall 2026"},
]
csl["who_you_are"] = [
    "A strong writer with a distinctive voice — you write like a human, not a press release",
    "Fluent in social-content thinking, especially short-form video and editorial IG",
    "Organized enough to build systems, scrappy enough to not need perfect conditions",
    "Genuinely excited by DAT's story",
    "Bilingual Spanish/English candidates are especially encouraged — DAT's Ecuador hub is an active story and a growing content territory",
]

# ── 1e. local-project-producer: strengthen Ecuador framing ───────────────────
lpp = find("local-project-producer")
lpp["long_description"] = (
    "DAT's next wave of projects — PASSAGE Slovakia 2026, Drama Club expansions, new community residencies "
    "in Ecuador and beyond — each needs a producer on the ground who knows the territory.\n\n"
    "The Local Project Producer is a project-based contract role: you come in for a specific project, "
    "own the local logistics, and leave with a strong credit and a standing invitation to come back. "
    "We're building a bench of project producers across our active hubs as DAT builds toward Season 21 and beyond.\n\n"
    "Ecuador-based and Quito-based candidates are especially encouraged to express interest. "
    "Bilingual Spanish/English is strongly preferred for Ecuador engagements. "
    "This role helps make Ecuador not just a program site, but a year-round DAT hub."
)
lpp["who_you_are"] = [
    "Based in or deeply familiar with the project hub (Slovakia, Ecuador/Quito, NYC, etc.)",
    "A practical, resourceful producer — you've managed logistics under pressure",
    "Warm, bridge-building energy",
    "Familiar with local arts, cultural, or community organizations",
    "For Ecuador engagements: bilingual Spanish/English strongly preferred; Quito-based candidates especially welcome",
]

# ── 1f. participant-donor-coordinator: fix timeline + add Ecuador note ────────
pdc = find("participant-donor-coordinator")
pdc["timeline"] = [
    {"label": "Expressions of Interest", "detail": "Open now — write to jobs@dramaticadventure.com"},
    {"label": "Target Start", "detail": "As soon as possible"},
]
pdc["long_description"] = (
    pdc["long_description"].rstrip()
    + "\n\nEcuador-based candidates, especially those based in Quito, are encouraged to express interest. "
    "Bilingual Spanish/English is a meaningful asset for this role given DAT's active Ecuador programs."
)
pdc["perks"] = [
    "Flexible hours",
    "Remote",
    "Steady contract",
    "Direct relationship with DAT's global community",
    "Access to DAT's alumni and artistic network",
    "Mentorship from DAT's development and program teams",
    "Priority consideration for future expanded roles",
]

# ── 1g. drama-club-teaching-artist-lead: strengthen Ecuador framing ──────────
dctal = find("drama-club-teaching-artist-lead")
dctal["long_description"] = (
    "DAT's Drama Clubs exist because young people deserve space to tell their own stories — "
    "and because communities are stronger when those stories are heard.\n\n"
    "The Drama Club Teaching Artist Lead facilitates DAT's storytelling and devising process with youth participants "
    "in an active hub (currently Slovakia and Ecuador). You'll bring artistic skill, cultural intelligence, "
    "and a genuine belief in young people's stories.\n\n"
    "Ecuador-based and Quito-based Teaching Artists are especially encouraged. "
    "Spanish proficiency is strongly preferred for Ecuador hubs. "
    "This role is part of DAT's Ecuador Founding Hub Team for Ecuador-based engagements — "
    "you'd be helping build the year-round teaching infrastructure behind DAT's Drama Club programs."
)
dctal["perks"] = [
    "Project-based contract fee (rate discussed with qualified applicants)",
    "Housing support for non-local hires where applicable",
    "Deep creative and community immersion",
    "Professional title and production credits",
    "DAT alumni and artist network access",
    "Priority consideration for future Drama Club and PLX program roles",
    "For Ecuador-based artists: part of DAT's Ecuador Founding Hub Team",
]

# ── 1h. development-intern: fix timeline + strengthen perks + add Ecuador ─────
di = find("development-intern")
di["timeline"] = [
    {"label": "Coming Soon", "detail": "Applications open when the internship cycle is confirmed; express interest now"},
    {"label": "Program Cycles", "detail": "Fall and Spring"},
    {"label": "Orientation", "detail": "Week 1 of program"},
]
di["long_description"] = (
    "The Development Intern works alongside DAT's Development team to support grant research, writing, "
    "donor communications, and CRM maintenance. You'll learn the mechanics of arts fundraising from the inside "
    "— deadlines, relationships, the ask, the story.\n\n"
    "DAT is rebuilding its paid capacity. This internship will be offered with a stipend target that we commit to "
    "sharing clearly before you accept. We also commit to making the learning real: "
    "you'll do actual grant work, not shadow work.\n\n"
    "Ecuador-based candidates, especially in Quito, are strongly encouraged to apply. "
    "Bilingual Spanish/English candidates are especially welcome. "
    "This internship may connect to DAT's Ecuador development and hub-building work."
)
di["perks"] = [
    "Stipend (amount confirmed before acceptance; target TBD based on funding)",
    "Academic credit may be possible",
    "Direct mentorship from DAT's Development team and senior advisors",
    "Portfolio of real grant research, donor materials, and development work",
    "Access to DAT's global alumni and artistic network",
    "Invitations to DAT donor events, salons, and artistic convenings",
    "Priority consideration for future paid project or staff roles",
    "Letter of recommendation after successful completion",
    "Field access may be possible depending on program calendar and funding",
]

# ── 1i. communications-storytelling-intern: fix timeline + strengthen + Ecuador
csi = find("communications-storytelling-intern")
csi["timeline"] = [
    {"label": "Coming Soon", "detail": "Applications open when the internship cycle is confirmed; express interest now"},
    {"label": "Program Cycles", "detail": "Fall and Spring"},
]
csi["long_description"] = (
    "The Communications & Storytelling Intern works with DAT's Comms team to draft, produce, and publish content "
    "across social media, email, and the alumni storytelling platform. You'll write in DAT's voice, "
    "edit alumni stories, draft social copy, and help build the editorial calendar.\n\n"
    "This internship will be offered with a stipend target confirmed before you accept. "
    "Scope is real — you'll have published bylines and portfolio work to show for it.\n\n"
    "Bilingual Spanish/English candidates are especially encouraged. "
    "Ecuador-based and Quito-based candidates are strongly welcome — "
    "DAT's Ecuador programs generate rich story material and a growing bilingual content need."
)
csi["perks"] = [
    "Stipend (amount confirmed before acceptance; target TBD based on funding)",
    "Published bylines on DAT's storytelling platform and communications channels",
    "Academic credit may be possible",
    "Portfolio of published pieces and social content",
    "Direct mentorship from DAT's Communications & Story Lead",
    "Access to DAT's global alumni and artistic network",
    "Invitations to DAT events, salons, and field briefings",
    "Priority consideration for future paid communications roles",
    "Letter of recommendation after successful completion",
]

# ── 1j. program-operations-intern: fix timeline + strengthen + Ecuador ────────
poi = find("program-operations-intern")
poi["timeline"] = [
    {"label": "Coming Soon", "detail": "Applications open when the internship cycle is confirmed; express interest now"},
    {"label": "Program Cycles", "detail": "Fall and Spring"},
]
poi["long_description"] = (
    "The Program Operations Intern supports the producing and program team with the logistics that keep DAT's work "
    "moving — tracking timelines, managing documentation, coordinating communications, "
    "and supporting program delivery across multiple active projects.\n\n"
    "This internship will be offered with a stipend target confirmed before you accept. "
    "Scope is hands-on — you'll own real producing tasks, not just observe.\n\n"
    "Ecuador-based candidates are strongly encouraged. "
    "This internship may connect directly to DAT's Ecuador program coordination and hub-building work. "
    "Bilingual Spanish/English is a meaningful asset."
)
poi["perks"] = [
    "Stipend (amount confirmed before acceptance; target TBD based on funding)",
    "Academic credit may be possible",
    "Hands-on producing and program management experience",
    "Direct mentorship from DAT's Managing Producer and program team",
    "Access to DAT's global alumni and artistic network",
    "Invitations to DAT artistic convenings and field briefings",
    "Priority consideration for future paid producing roles",
    "Letter of recommendation after successful completion",
    "Field access may be possible depending on program calendar and funding",
]

# ── 1k. alumni-community-engagement-intern: fix timeline + strengthen + Ecuador
acei = find("alumni-community-engagement-intern")
acei["timeline"] = [
    {"label": "Coming Soon", "detail": "Applications open when the internship cycle is confirmed; express interest now"},
    {"label": "Program Cycles", "detail": "Fall and Spring"},
]
acei["long_description"] = (
    "The Alumni & Community Engagement Intern supports DAT's relationship with its global alumni network — "
    "helping with outreach, event logistics, the alumni storytelling platform, "
    "and the communications that keep people connected to each other and to the organization.\n\n"
    "This internship will be offered with a stipend target confirmed before you accept.\n\n"
    "Ecuador-based candidates are especially encouraged. "
    "DAT has a rich community of Ecuador alumni, Drama Club families, and local collaborators "
    "who are a central part of this work. Bilingual Spanish/English is a meaningful asset."
)
acei["perks"] = [
    "Stipend (amount confirmed before acceptance; target TBD based on funding)",
    "Academic credit may be possible",
    "Deep access to DAT's extraordinary global community",
    "Direct mentorship from DAT's program and community engagement team",
    "Access to DAT's alumni and artistic network",
    "Invitations to alumni events, salons, and convenings",
    "Priority consideration for future paid community or program roles",
    "Letter of recommendation after successful completion",
]

# ── 1l. digital-website-intern: fix timeline ──────────────────────────────────
dwi = find("digital-website-intern")
dwi["timeline"] = [
    {"label": "Coming Soon", "detail": "Applications open when the internship cycle is confirmed; express interest now"},
    {"label": "Program Cycles", "detail": "Fall and Spring"},
]
dwi["perks"] = list(dwi.get("perks", [])) + [
    "Direct mentorship from DAT's technical and communications teams",
    "Priority consideration for future paid digital roles",
    "Letter of recommendation after successful completion",
]

# ── 1m. production-intern: fix timeline ───────────────────────────────────────
prodi = find("production-intern")
prodi["timeline"] = [
    {"label": "Coming Soon", "detail": "Applications open when the internship cycle is confirmed; express interest now"},
    {"label": "Program Cycles", "detail": "Fall and Spring"},
]
prodi["perks"] = list(prodi.get("perks", [])) + [
    "Direct mentorship from DAT's producing team",
    "Priority consideration for future paid production roles",
    "Letter of recommendation after successful completion",
]

# ── 1n. research-dramaturgy-intern: fix timeline ──────────────────────────────
rdi = find("research-dramaturgy-intern")
rdi["timeline"] = [
    {"label": "Coming Soon", "detail": "Applications open when the internship cycle is confirmed; express interest now"},
    {"label": "Program Cycles", "detail": "Fall and Spring"},
]
rdi["perks"] = list(rdi.get("perks", [])) + [
    "Direct mentorship from DAT's artistic leadership",
    "Access to DAT's alumni and artistic network",
    "Priority consideration for future paid research or artistic roles",
    "Letter of recommendation after successful completion",
]

# ── 1o. producing-apprentice: fix timeline + fix travel perk + Ecuador ────────
pa = find("producing-apprentice")
pa["timeline"] = [
    {"label": "Coming Soon", "detail": "Applications open when the apprenticeship cycle is confirmed; express interest now"},
    {"label": "Program Cycles", "detail": "Fall intake"},
    {"label": "Field Travel", "detail": "May be available within program year, subject to project calendar and funding"},
]
pa["perks"] = [
    "Producing stipend (amount confirmed before acceptance; target TBD based on funding)",
    "Real ownership of producing responsibilities — not a shadow experience",
    "Professional title and production credits on DAT programs",
    "Direct mentorship from DAT's Managing Producer, Artistic Director, and senior advisors",
    "Training in arts administration, international producing, fundraising, and cross-cultural collaboration",
    "Access to DAT's global alumni and artistic network",
    "Invitations to DAT salons, donor events, artistic convenings, and field briefings",
    "Priority consideration for future paid producing roles",
    "Letter of recommendation after successful completion",
    "Field travel may be available when aligned with program needs and funding; travel is discussed before engagement and is not a substitute for agreed compensation",
    "Ecuador-based candidates are strongly encouraged — this apprenticeship may connect to DAT's Ecuador program coordination and hub-building work",
]

# ── 1p. teaching-artist-apprentice: fix timeline ──────────────────────────────
taa = find("teaching-artist-apprentice")
taa["timeline"] = [
    {"label": "Coming Soon", "detail": "Applications open when the apprenticeship cycle is confirmed; express interest now"},
    {"label": "Program Cycles", "detail": "Fall intake"},
]
taa["perks"] = list(taa.get("perks", [])) or [
    "Stipend (amount confirmed before acceptance; target TBD)",
    "Real teaching artistry experience — not observation",
    "Professional title and program credits",
    "Direct mentorship from DAT's Teaching Artists and Artistic Director",
    "Training in community-engaged theatre, devising, and cross-cultural facilitation",
    "Access to DAT's alumni and artistic network",
    "Priority consideration for future paid teaching artist roles",
    "Letter of recommendation after successful completion",
    "Field access may be available depending on program calendar and funding",
]
# Overwrite fully since it may be thin:
taa["perks"] = [
    "Stipend (amount confirmed before acceptance; target TBD based on funding)",
    "Real teaching artistry responsibility — you lead sessions, not shadow them",
    "Professional title and program credits",
    "Direct mentorship from DAT's Teaching Artists and Artistic Director",
    "Training in community-engaged theatre, devising, and cross-cultural facilitation",
    "Access to DAT's global alumni and artistic network",
    "Invitations to DAT artistic convenings, field briefings, and community events",
    "Priority consideration for future paid teaching artist and Drama Club roles",
    "Letter of recommendation after successful completion",
    "Field travel may be available when aligned with program needs and funding; travel is discussed before engagement",
]

# ── 1q. community-engagement-apprentice: fix timeline + fix travel + Ecuador ──
cea = find("community-engagement-apprentice")
cea["timeline"] = [
    {"label": "Coming Soon", "detail": "Applications open when the apprenticeship cycle is confirmed; express interest now"},
    {"label": "Program Cycles", "detail": "Fall intake"},
]
cea["perks"] = [
    "Community engagement stipend (amount confirmed before acceptance; target TBD based on funding)",
    "Real community engagement responsibility — you own relationships, not just logistics",
    "Professional title and program credits",
    "Direct mentorship from DAT's program and community engagement leadership",
    "Formal training in community-engaged theatre, cross-cultural collaboration, and arts facilitation",
    "Access to DAT's global alumni and artistic network",
    "Invitations to DAT artistic convenings, field briefings, and community events",
    "Priority consideration for future paid community engagement and program roles",
    "Letter of recommendation after successful completion",
    "Field travel may be available when aligned with program needs and funding; travel is discussed before engagement and is not a substitute for agreed compensation",
    "Ecuador-based and Quito-based candidates are especially encouraged — this apprenticeship may connect directly to DAT's Ecuador community engagement and hub-building work",
]

# ── 1r. stage-management-production-apprentice: fix timeline ─────────────────
smpa = find("stage-management-production-apprentice")
smpa["timeline"] = [
    {"label": "Coming Soon", "detail": "Applications open when the apprenticeship cycle is confirmed; express interest now"},
    {"label": "Program Cycles", "detail": "Fall intake"},
    {"label": "Production Credits", "detail": "Within program year"},
]
smpa["perks"] = list(smpa.get("perks", [])) or []
if not any("stipend" in p.lower() for p in smpa["perks"]):
    smpa["perks"] = [
        "Stipend (amount confirmed before acceptance; target TBD based on funding)",
        "Real stage management and production responsibility",
        "Professional production credits",
        "Direct mentorship from DAT's producing team",
        "Access to DAT's alumni and artistic network",
        "Priority consideration for future paid stage management roles",
        "Letter of recommendation after successful completion",
        "Field travel may be available when aligned with program needs and funding; travel is discussed before engagement",
    ]

# ── 1s. documentation-apprentice: fix timeline + fix travel + Ecuador ─────────
doca = find("documentation-apprentice")
doca["timeline"] = [
    {"label": "Coming Soon", "detail": "Applications open when the apprenticeship cycle is confirmed; express interest now"},
    {"label": "Program Cycles", "detail": "Fall intake"},
    {"label": "Field Documentation", "detail": "At least one program field period within program year, subject to project calendar and funding"},
]
doca["perks"] = [
    "Documentation stipend (amount confirmed before acceptance; target TBD based on funding)",
    "Published portfolio work — photos, video reels, written documentation — with DAT attribution",
    "Real ownership of a documentary practice, not an assistant role",
    "Professional title and documentation credits",
    "Direct mentorship from DAT's Communications & Story Lead and Artistic Director",
    "Training in documentary storytelling, arts communications, and cross-cultural content strategy",
    "Access to DAT's global alumni and artistic network",
    "Invitations to DAT convenings, field briefings, and artistic events",
    "Priority consideration for future paid documentation and communications roles",
    "Letter of recommendation after successful completion",
    "Field travel may be available when aligned with program needs and funding; travel is discussed before engagement and is not a substitute for agreed compensation",
    "Ecuador-based candidates are especially encouraged — DAT's Ecuador programs generate extraordinary documentary material",
]

# ── 1t. devising-ensemble-apprentice: fix timeline ───────────────────────────
deva = find("devising-ensemble-apprentice")
deva["timeline"] = [
    {"label": "Coming Soon", "detail": "Applications open when the apprenticeship cycle is confirmed; express interest now"},
    {"label": "Program Cycles", "detail": "Fall intake"},
    {"label": "Performance Work", "detail": "Within program year"},
]
deva["perks"] = list(deva.get("perks", [])) or []
if not any("stipend" in p.lower() for p in deva["perks"]):
    deva["perks"] = [
        "Stipend (amount confirmed before acceptance; target TBD based on funding)",
        "Real ensemble performance and devising experience",
        "Professional production credits",
        "Direct mentorship from DAT's Artistic Director and ensemble artists",
        "Training in devising, ensemble creation, and community-engaged theatre",
        "Access to DAT's global alumni and artistic network",
        "Priority consideration for future paid ensemble roles",
        "Letter of recommendation after successful completion",
        "Field travel may be available when aligned with program needs and funding; travel is discussed before engagement",
    ]

# ── 1u. dramaturgy-adaptation-apprentice: fix timeline ───────────────────────
draa = find("dramaturgy-adaptation-apprentice")
draa["timeline"] = [
    {"label": "Coming Soon", "detail": "Applications open when the apprenticeship cycle is confirmed; express interest now"},
    {"label": "Program Cycles", "detail": "Fall intake"},
]
draa["perks"] = list(draa.get("perks", [])) or []
if not any("stipend" in p.lower() for p in draa["perks"]):
    draa["perks"] = [
        "Stipend (amount confirmed before acceptance; target TBD based on funding)",
        "Real dramaturgy and adaptation work — not a reading list",
        "Professional dramaturgical credits",
        "Direct mentorship from DAT's Artistic Director and resident artists",
        "Training in adaptation, community storytelling, and cross-cultural dramaturgy",
        "Access to DAT's global alumni and artistic network",
        "Priority consideration for future paid dramaturgical and artistic roles",
        "Letter of recommendation after successful completion",
    ]

# ── 1v. volunteer records: strengthen perks where sparse ──────────────────────
# alumni-outreach-captain
aoc = find("alumni-outreach-captain")
aoc["perks"] = [
    "Invitations to alumni events, salons, and convenings",
    "Quarterly briefings from the DAT team on programs, strategy, and upcoming projects",
    "Recognition in DAT's network communications and annual report",
    "Access to DAT's alumni and artistic network",
    "Letter of reference available",
]

# story-collector
sc = find("story-collector")
sc["perks"] = [
    "Published byline credit on DAT's storytelling platform (by arrangement)",
    "Deep access to DAT's extraordinary global community",
    "Writing and interview samples for your portfolio",
    "Invitations to DAT events, salons, and convenings",
    "Letter of reference available after consistent contribution",
]

# grant-research-volunteer
grv = find("grant-research-volunteer")
grv["perks"] = [
    "Real development experience — your research shapes DAT's grant calendar",
    "Portfolio of development research work",
    "Direct briefings from DAT's Development team on strategy and priorities",
    "Access to DAT's alumni and artistic network",
    "Invitations to DAT events and donor convenings",
    "Letter of reference available after consistent contribution",
]

# data-crm-volunteer
dcv = find("data-crm-volunteer")
dcv["perks"] = [
    "Hands-on CRM and data management experience",
    "Portfolio of data work for your professional profile",
    "Access to DAT's team and network",
    "Letter of reference available after consistent contribution",
]

# program-recruitment-ambassador
pra = find("program-recruitment-ambassador")
pra["perks"] = [
    "First look at new program announcements and season planning",
    "Invitations to DAT events, salons, and convenings",
    "Access to DAT's global alumni and artistic network",
    "Recognition in program materials and DAT communications",
    "Letter of reference available after consistent contribution",
]

# travel-logistics-research-volunteer
tlrv = find("travel-logistics-research-volunteer")
tlrv["perks"] = [
    "Real producing and logistics experience — your research directly informs DAT's field decisions",
    "Portfolio of international logistics research",
    "Insight into the actual infrastructure of international theatre-making",
    "Access to DAT's alumni and artistic network",
    "Invitations to field briefings and producing convenings",
    "Letter of reference available after consistent contribution",
]

# community-partner-liaison
cpl = find("community-partner-liaison")
cpl["perks"] = [
    "DAT community access and deep insight into our regional partnerships",
    "Invitations to relevant DAT programs, events, and salons in your region",
    "Access to DAT's global alumni and artistic network",
    "Recognition in regional partnership materials",
    "Letter of reference available after consistent contribution",
]

# board-committee-member
bcm = find("board-committee-member")
bcm["perks"] = [
    "Meaningful governance engagement without full Board commitment",
    "DAT community access and invitations to programs, salons, and artistic convenings",
    "Direct engagement with DAT's Artistic Director and Board leadership",
    "Access to DAT's global alumni and artistic network",
    "Letter of reference available",
]

# host-committee-member
hcm = find("host-committee-member")
hcm["perks"] = [
    "Invitations to all DAT events you help host",
    "DAT community access and social inclusion at events",
    "Recognition in event materials (optional)",
    "Access to DAT's alumni and artistic network",
]


# ═══════════════════════════════════════════════════════════════════════════
# SECTION 2 — New Ecuador records
# ═══════════════════════════════════════════════════════════════════════════

ecuador_records = [
    {
        "id": "ecuador-development-partnerships-lead",
        "title": "Ecuador-Based Development & Partnerships Lead",
        "type": "job",
        "role_types": "arts_admin,development",
        "hub": "quito",
        "description": "Build DAT's funding base and institutional relationships in Ecuador and the Andean region. Cultivate local sponsors, embassies, universities, and donors; support ACTion, Drama Club, and hub-building campaigns. Bilingual Spanish/English strongly preferred. Part of DAT's Ecuador Founding Hub Team.",
        "commitment": "Part-time or fractional (10–25 hrs/wk depending on scope)",
        "commitment_type": "part-time",
        "is_paid": "TRUE",
        "compensation": "Part-time contract, stipend, fellowship, or low-retainer arrangement; amount to be finalized based on scope, funding, and candidate location. DAT is open to phased arrangements that can grow with revenue.",
        "status": "coming_soon",
        "deadline": "",
        "season": "2026–2027",
        "featured": "TRUE",
        "plx_program": "",
        "apply_url": "/apply?opp=ecuador-development-partnerships-lead",
        "learn_more_url": "",
        "order": 8,
        "hero_image": "",
        "long_description": (
            "DAT's Ecuador work — ACTion expeditions, Drama Clubs, Teaching Artist Residencies — needs local institutional roots to become sustainable. This role helps build those roots.\n\n"
            "The Ecuador-Based Development & Partnerships Lead will research and cultivate local donors, sponsors, foundations, universities, embassies, and cultural institutes in Ecuador and the Andean region. "
            "You'll be part of DAT's Ecuador Founding Hub Team — helping make Quito not just a program site, but a year-round organizational hub.\n\n"
            "DAT is rebuilding its paid capacity. This role is best understood as a part-time contract, stipend, fellowship, or low-retainer arrangement to start, with real room to grow as revenue and funding develop. "
            "We are committed to being honest about scope, expectations, and what DAT can offer in return — and to building an arrangement that works for the right candidate.\n\n"
            "This role is best for someone who values real responsibility, mentorship, international arts access, portfolio-building work, and the chance to help build a lasting creative hub."
        ),
        "what_youll_do": [
            "Research Ecuadorian and regional foundations, corporate sponsors, embassies, and cultural institutes with potential interest in DAT's work",
            "Build and steward relationships with Quito-based donors, sponsors, and institutional partners",
            "Support DAT fundraising campaigns connected to Ecuador programs (ACTion, Drama Clubs, sponsor-a-fellow, etc.)",
            "Coordinate or support small Quito-based donor events and salon gatherings",
            "Draft Spanish-language sponsor and partnership materials in coordination with DAT's Comms team",
            "Represent DAT at relevant Quito arts, education, and cultural convenings",
            "Maintain records of Ecuador-based prospects and relationships in DAT's CRM",
        ],
        "who_you_are": [
            "Based in Quito or Ecuador (strongly preferred) — you know the local arts, education, nonprofit, or business landscape",
            "Bilingual Spanish/English — you can write and speak comfortably in both languages",
            "A relationship-builder with patience for the long game of institutional development",
            "Organized, entrepreneurial, and comfortable working with limited infrastructure at a growth-stage organization",
            "Genuinely committed to DAT's mission and to Ecuador's role as a real hub — not just a program destination",
        ],
        "requirements": [
            "Experience in development, fundraising, partnerships, nonprofit administration, or related field",
            "Bilingual Spanish/English strongly preferred",
            "Based in Ecuador strongly preferred; Quito-based strongly encouraged",
            "Ability to work independently and communicate proactively with DAT HQ (US hours overlap helpful)",
            "References from prior professional or community work",
        ],
        "perks": [
            "Part-time contract, stipend, fellowship, or low-retainer arrangement — phased growth possible as funding develops",
            "Real ownership of DAT's Ecuador development infrastructure — not an assistant role",
            "Professional title and credits: Ecuador-Based Development & Partnerships Lead, DAT Ecuador Founding Hub Team",
            "Direct mentorship from DAT's Artistic Director, Development team, and senior advisors",
            "Training in arts administration, nonprofit fundraising, international producing, and cross-cultural collaboration",
            "Access to DAT's alumni and artistic network across three continents",
            "Priority consideration for future expanded paid roles as DAT's Ecuador hub grows",
            "Invitations to DAT donor events, salons, and artistic convenings (local and international)",
            "Letter of recommendation after successful engagement",
            "Field travel may be available when aligned with program needs and funding; travel is discussed before engagement and is not a substitute for agreed compensation",
        ],
        "timeline": [
            {"label": "Expressions of Interest", "detail": "Open now — write to jobs@dramaticadventure.com"},
            {"label": "Target Start", "detail": "Fall 2026 or earlier depending on fit"},
        ],
        "faq": [
            {"q": "Does this role require in-person presence in Quito?",
             "a": "Quito-based or Ecuador-based is strongly preferred. Some responsibilities — local events, partner meetings — are most effective in person. Remote arrangements may be possible for the right candidate."},
            {"q": "Is the compensation posted?",
             "a": "Compensation will be discussed directly with qualified candidates. DAT is open to part-time contract, stipend, fellowship, or phased retainer arrangements that can grow with revenue."},
            {"q": "What does 'Founding Hub Team' mean?",
             "a": "DAT is building year-round organizational infrastructure in Ecuador — not just running programs there. Early team members in Ecuador are foundational to that project and will shape what it becomes."},
        ],
        "contact_email": "jobs@dramaticadventure.com",
    },
    {
        "id": "ecuador-program-partnerships-coordinator",
        "title": "Ecuador Program & Partnerships Coordinator",
        "type": "job",
        "role_types": "arts_admin,community_engagement",
        "hub": "quito",
        "description": "Coordinate DAT's ACTion, Drama Club, and Teaching Artist Residency programs in Ecuador. Build and maintain local partner relationships with schools, community organizations, venues, universities, and artists. Part of DAT's Ecuador Founding Hub Team. Bilingual Spanish/English strongly preferred.",
        "commitment": "Part-time or project-based (15–25 hrs/wk depending on season)",
        "commitment_type": "part-time",
        "is_paid": "TRUE",
        "compensation": "Part-time contract, stipend, fellowship, or low-retainer arrangement; amount to be finalized based on scope, funding, and candidate location. DAT is open to phased arrangements that can grow with revenue.",
        "status": "coming_soon",
        "deadline": "",
        "season": "2026–2027",
        "featured": "TRUE",
        "plx_program": "",
        "apply_url": "/apply?opp=ecuador-program-partnerships-coordinator",
        "learn_more_url": "",
        "order": 9,
        "hero_image": "",
        "long_description": (
            "DAT's Ecuador programs — ACTion expeditions, Drama Clubs, Teaching Artist Residencies — depend on strong local relationships with schools, community organizations, venues, artists, and families. "
            "This role is the connective tissue between DAT HQ and the communities we work with in Ecuador.\n\n"
            "The Ecuador Program & Partnerships Coordinator supports program delivery, manages local partner communications, and helps build the year-round infrastructure that makes Ecuador a real DAT hub — not just a destination.\n\n"
            "This is an arts administration, program coordination, and community-building opportunity. "
            "DAT may begin this role as a part-time contract, stipend, fellowship, or low-retainer arrangement, with genuine room to grow as funding develops. "
            "We are committed to being honest about scope, expectations, and what DAT can offer in return.\n\n"
            "This role is part of DAT's Ecuador Founding Hub Team. You would help build the year-round infrastructure behind DAT's Ecuador programs."
        ),
        "what_youll_do": [
            "Coordinate logistics for DAT's active Ecuador programs — ACTion, Drama Clubs, Teaching Artist Residencies",
            "Build and maintain relationships with Quito and Ecuador-based schools, community organizations, venues, and local artists",
            "Support participant and family communications for Drama Club programs in Spanish and English",
            "Manage local logistics — space reservations, materials, transport, hospitality — for program delivery",
            "Liaise between DAT HQ, local co-facilitators, Teaching Artists, and community partners",
            "Track program documentation and contribute to DAT's storytelling and reporting",
            "Represent DAT at local education, arts, and community partner meetings",
        ],
        "who_you_are": [
            "Based in Quito or Ecuador — you understand the local community, education, and arts landscape",
            "Bilingual Spanish/English — you communicate warmly and clearly in both languages",
            "An arts administration or community engagement professional — you love the infrastructure that makes creative work possible",
            "Organized, warm, and skilled at holding multiple relationships simultaneously",
            "Committed to youth-centered, community-rooted storytelling and theatre work",
        ],
        "requirements": [
            "Experience in program coordination, arts administration, community engagement, education, or related field",
            "Bilingual Spanish/English strongly preferred",
            "Based in Ecuador strongly preferred; Quito-based strongly encouraged",
            "Familiarity with Ecuador's education, arts, or nonprofit landscape helpful",
            "Reliable, proactive communicator with DAT HQ across time zones",
        ],
        "perks": [
            "Part-time contract, stipend, fellowship, or low-retainer arrangement — phased growth possible",
            "Real ownership of DAT's Ecuador program logistics and partnerships — a builder role, not a support role",
            "Professional title and credits: Ecuador Program & Partnerships Coordinator, DAT Ecuador Founding Hub Team",
            "Direct mentorship from DAT's Managing Producer, Artistic Director, and program team",
            "Training in arts administration, international program coordination, community-engaged theatre, and teaching artistry",
            "Access to DAT's global alumni and artistic network",
            "Priority consideration for future expanded paid roles as DAT's Ecuador hub grows",
            "Invitations to DAT artistic convenings, donor events, and field briefings",
            "Letter of recommendation after successful engagement",
            "In-program field access — when programs are active in Ecuador, this role is in the room",
        ],
        "timeline": [
            {"label": "Expressions of Interest", "detail": "Open now — write to jobs@dramaticadventure.com"},
            {"label": "Target Start", "detail": "Fall 2026 or Spring 2027 depending on program calendar"},
        ],
        "faq": [
            {"q": "Does this role require in-person presence in Ecuador?",
             "a": "Yes — this is primarily an in-person coordination role. Quito-based or Ecuador-based is required for most responsibilities."},
            {"q": "What is DAT's current Ecuador footprint?",
             "a": "DAT runs ACTion expeditions, Drama Clubs, and Teaching Artist Residencies in Ecuador. Quito is our primary hub. We're building toward more consistent year-round programming."},
            {"q": "Will this role grow over time?",
             "a": "Yes — that's the intention. Early hub-builders who help establish DAT's Ecuador infrastructure will have first right of consideration for expanded paid roles as funding develops."},
        ],
        "contact_email": "jobs@dramaticadventure.com",
    },
    {
        "id": "ecuador-local-producer",
        "title": "Ecuador Local Producer / Ground Coordinator",
        "type": "job",
        "role_types": "arts_admin,community_engagement",
        "hub": "quito",
        "description": "Project-based producing and logistics coordination for DAT programs in Ecuador — ACTion expeditions, Drama Club seasons, Teaching Artist Residencies, and field work across the country. Paid when active. Bilingual Spanish/English required. Part of DAT's Ecuador Founding Hub Team.",
        "commitment": "Project-based (varies by program; typically 1–3 months per engagement)",
        "commitment_type": "short-term",
        "is_paid": "TRUE",
        "compensation": "Paid when placed; project contract fee varies by program and funding. In-field housing, meals, or in-kind support may be included depending on the project; all logistics expectations are discussed before engagement.",
        "status": "evergreen",
        "deadline": "",
        "season": "",
        "featured": "FALSE",
        "plx_program": "",
        "apply_url": "/apply?opp=ecuador-local-producer",
        "learn_more_url": "",
        "order": 10,
        "hero_image": "",
        "long_description": (
            "When DAT is active in Ecuador — an ACTion expedition, a Drama Club season, a Teaching Artist Residency, a community performance — we need a producer on the ground who knows the territory.\n\n"
            "The Ecuador Local Producer / Ground Coordinator is a project-based role: you come in for a specific engagement, own the local logistics, and leave with a strong credit and a standing invitation to come back. "
            "We're building a reliable bench of Ecuador-based producers as DAT grows its year-round Ecuador footprint.\n\n"
            "Paid when active; contract fee varies by project and funding. In-field housing, meals, or other in-kind support may be included depending on the program. "
            "Travel, out-of-pocket expectations, and logistics support are discussed clearly before engagement begins.\n\n"
            "This role is part of DAT's Ecuador Founding Hub Team."
        ),
        "what_youll_do": [
            "Own local logistics for a specific DAT program in Ecuador — housing, venues, transport, hospitality, permits",
            "Coordinate with local community partners, schools, artists, and venues",
            "Manage the local project budget and logistics timeline in partnership with DAT's Managing Producer",
            "Serve as primary liaison between DAT HQ and on-the-ground reality during the program",
            "Support artist arrivals, orientations, and day-to-day production needs",
            "Document the program for DAT's records and storytelling channels",
            "Build and maintain local vendor and partner relationships between engagements",
        ],
        "who_you_are": [
            "Based in Ecuador — you know Quito well and have working knowledge of DAT's program regions",
            "Bilingual Spanish/English — essential for this role",
            "A practical, resourceful producer — you've managed logistics under pressure and solve problems before they become crises",
            "Warm and bridge-building — you connect DAT artists with communities with care and cultural intelligence",
            "Familiar with Ecuador's arts, education, or community organization landscape",
        ],
        "requirements": [
            "Based in Ecuador; Quito-based strongly preferred",
            "Bilingual Spanish/English required",
            "2+ years of producing, event management, project coordination, or community organizing experience",
            "Ability to commit fully to a project during the active program period",
            "References from prior production or community work",
        ],
        "perks": [
            "Paid when placed; project contract fee confirmed per engagement",
            "In-field housing, meals, or in-kind support may be included depending on the program",
            "Professional title and production credits on DAT programs",
            "DAT alumni and artist network access",
            "First right of consideration for future DAT Ecuador engagements",
            "Portfolio documentation from each program",
            "Invitations to DAT field briefings, artistic convenings, and community events",
        ],
        "timeline": [
            {"label": "Evergreen Roster", "detail": "Express interest now; we'll match you when the right project opens"},
            {"label": "Next Ecuador Programs", "detail": "2026–2027 season; specific dates to be confirmed"},
        ],
        "faq": [
            {"q": "Is this a full-time role?",
             "a": "No — it's project-based. You're engaged for a specific program, then we stay in close touch for the next one."},
            {"q": "Do I need to speak both Spanish and English?",
             "a": "Yes — bilingual Spanish/English is required. You'll be communicating with DAT HQ (US-based) and with local Ecuadorian partners and communities."},
        ],
        "contact_email": "jobs@dramaticadventure.com",
    },
    {
        "id": "ecuador-bilingual-story-coordinator",
        "title": "Bilingual Communications & Story Coordinator — Ecuador",
        "type": "job",
        "role_types": "arts_admin,marketing,community_engagement",
        "hub": "quito",
        "description": "Collect and shape stories from DAT's Ecuador programs — Drama Club youth, Teaching Artists, ACTion participants, local collaborators. Support bilingual Spanish/English content creation, photo/video coordination, local press, and campaign materials. Stipend or fellowship arrangement. Part of DAT's Ecuador Founding Hub Team.",
        "commitment": "Part-time or project-based (10–20 hrs/wk)",
        "commitment_type": "part-time",
        "is_paid": "TRUE",
        "compensation": "Stipend, fellowship, or project contract; amount to be finalized based on scope and funding. DAT is open to phased arrangements.",
        "status": "coming_soon",
        "deadline": "",
        "season": "2026–2027",
        "featured": "FALSE",
        "plx_program": "",
        "apply_url": "/apply?opp=ecuador-bilingual-story-coordinator",
        "learn_more_url": "",
        "order": 11,
        "hero_image": "",
        "long_description": (
            "DAT's Ecuador programs generate extraordinary material — Drama Club youth discovering their voices, communities transformed by ACTion expeditions, Teaching Artists building cross-cultural bridges. "
            "But capturing those stories in Spanish and in English, for local audiences and for DAT's global community, requires someone who can live inside both languages and both worlds.\n\n"
            "The Bilingual Communications & Story Coordinator — Ecuador supports Spanish/English story collection, Drama Club documentation, local artist interviews, photo and video coordination, campaign materials, "
            "and outreach to Ecuadorian press and storytelling platforms.\n\n"
            "This role may begin as a stipend, fellowship, or project contract depending on scope and funding. "
            "We are committed to being honest about expectations and to making the learning and professional-development value real.\n\n"
            "This role is part of DAT's Ecuador Founding Hub Team."
        ),
        "what_youll_do": [
            "Conduct story interviews with Drama Club youth, Teaching Artists, local collaborators, and ACTion participants in Spanish and English",
            "Draft and edit bilingual content — stories, social posts, donor updates, program descriptions — for DAT's platforms",
            "Coordinate photo and video documentation during Ecuador programs",
            "Prepare Spanish-language versions of campaign materials, program descriptions, and community communications",
            "Support outreach to Ecuadorian local press, arts publications, and storytelling platforms",
            "Work closely with DAT's Communications & Story Lead (US-based) to align Ecuador content with DAT's editorial voice",
        ],
        "who_you_are": [
            "Fluent in both Spanish and English — you write naturally and with voice in both languages",
            "A storyteller by instinct — you know how to find the moment inside a conversation",
            "Based in Ecuador or with deep Ecuador roots",
            "Comfortable with basic photo or video documentation",
            "Interested in arts, community, theatre, or youth development",
        ],
        "requirements": [
            "Bilingual Spanish/English — strong written proficiency in both languages required",
            "Writing portfolio or samples in at least one language",
            "Based in Ecuador strongly preferred",
            "Experience in journalism, communications, storytelling, arts documentation, or related field helpful",
        ],
        "perks": [
            "Stipend, fellowship, or project contract — amount confirmed based on scope and funding",
            "Published bylines and content credits in Spanish and English across DAT's platforms",
            "Portfolio of published work samples",
            "Direct mentorship from DAT's Communications & Story Lead and Artistic Director",
            "Training in documentary storytelling, arts communications, and cross-cultural content strategy",
            "Access to DAT's global alumni and artistic network",
            "In-program field access — when programs are active in Ecuador, this role is in the room",
            "Invitations to DAT convenings, donor events, and field briefings",
            "Letter of recommendation after successful engagement",
        ],
        "timeline": [
            {"label": "Expressions of Interest", "detail": "Open now — write to jobs@dramaticadventure.com"},
            {"label": "Target Start", "detail": "Fall 2026 or aligned with active Ecuador program"},
        ],
        "faq": [
            {"q": "Does this require in-person presence in Ecuador?",
             "a": "Strongly preferred — the story collection and program documentation work is most effective in person. Some content work can be done remotely."},
            {"q": "Do I need to be a professional journalist or filmmaker?",
             "a": "No. Strong writing and storytelling instincts matter more than a specific credential. A portfolio showing you can find and tell a compelling story is the main bar."},
        ],
        "contact_email": "jobs@dramaticadventure.com",
    },
]

# ─── Insert Ecuador records after drama-club-teaching-artist-lead ─────────────
insert_after = "drama-club-teaching-artist-lead"
insert_idx = next((i for i, r in enumerate(records) if r["id"] == insert_after), None)
if insert_idx is None:
    raise ValueError(f"Could not find insertion point: {insert_after}")

for i, rec in enumerate(ecuador_records):
    records.insert(insert_idx + 1 + i, rec)

# ═══════════════════════════════════════════════════════════════════════════
# SECTION 3 — Validation
# ═══════════════════════════════════════════════════════════════════════════

REQUIRED_KEYS = [
    "id","title","type","role_types","hub","description","commitment",
    "commitment_type","is_paid","compensation","status","deadline","season",
    "featured","plx_program","apply_url","learn_more_url","order",
    "hero_image","long_description","what_youll_do","who_you_are",
    "requirements","perks","timeline","faq","contact_email",
]
VALID_TYPES = {"plx","artist","audition","arts_admin","job","volunteer","participant"}
VALID_HUBS = {"nyc","quito","brno","bagamoyo","sydney","remote"}
VALID_COMMITMENT_TYPES = {"full-time","part-time","short-term","one-time","flexible"}
VALID_STATUSES = {"open","coming_soon","evergreen","closed"}
VALID_PLX = {"internship","apprenticeship",""}
FORBIDDEN_STRINGS = ["Season 19", "S19 ", " S19", "fifteen years", "15 years"]

errors = []
ids_seen = set()
for r in records:
    rid = r.get("id","<MISSING>")
    if rid in ids_seen:
        errors.append(f"DUPLICATE ID: {rid}")
    ids_seen.add(rid)

    missing = [k for k in REQUIRED_KEYS if k not in r]
    if missing:
        errors.append(f"{rid}: missing keys {missing}")

    if r.get("type") not in VALID_TYPES:
        errors.append(f"{rid}: invalid type '{r.get('type')}'")
    if r.get("hub") not in VALID_HUBS:
        errors.append(f"{rid}: invalid hub '{r.get('hub')}'")
    if r.get("commitment_type") not in VALID_COMMITMENT_TYPES:
        errors.append(f"{rid}: invalid commitment_type '{r.get('commitment_type')}'")
    if r.get("status") not in VALID_STATUSES:
        errors.append(f"{rid}: invalid status '{r.get('status')}'")
    if r.get("plx_program") not in VALID_PLX:
        errors.append(f"{rid}: invalid plx_program '{r.get('plx_program')}'")

    # Check forbidden strings in all string fields
    full_text = json.dumps(r)
    for s in FORBIDDEN_STRINGS:
        if s in full_text:
            errors.append(f"{rid}: contains forbidden string '{s}'")

if errors:
    print("VALIDATION ERRORS:")
    for e in errors:
        print(" ", e)
    import sys; sys.exit(1)

print(f"Validation passed. {len(records)} records, {len(ids_seen)} unique IDs.")

# ─── Write output ─────────────────────────────────────────────────────────────
with open("opportunities_seed_records.json", "w", encoding="utf-8") as f:
    json.dump(records, f, indent=2, ensure_ascii=False)
    f.write("\n")

print(f"Written: opportunities_seed_records.json ({len(records)} records)")
