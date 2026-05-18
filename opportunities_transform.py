#!/usr/bin/env python3
"""
opportunities_transform.py — Season 20 opportunities cleanup

Run from repo root: python3 opportunities_transform.py
Output: opportunities_seed_records.json (overwritten in place)
"""

import json
import sys

INPUT = "opportunities_seed_records.json"
OUTPUT = "opportunities_seed_records.json"

with open(INPUT) as f:
    records = json.load(f)

by_id = {r["id"]: r for r in records}

# ─── 1. Fix executive-director ───────────────────────────────────────────────
ed = by_id["executive-director"]
ed["long_description"] = (
    "As DAT completes its 20th season — twenty years of artist-led, community-rooted "
    "international theatre-making — we need an Executive Director who can hold the organization "
    "while we reach for what's next.\n\n"
    "We've built Drama Clubs in Slovakia and Ecuador, mounted ACTion expeditions to Tanzania, "
    "Czechia, and beyond, grown an alumni network spanning continents, and developed a "
    "storytelling platform rooted in real community voices. Now we're building the infrastructure "
    "to scale thoughtfully and sustain what we've made.\n\n"
    "This is a rare seat: direct partnership with the Artistic Director, meaningful creative "
    "proximity, and real institutional work. The ED will oversee operations, finance, development "
    "infrastructure, partnerships, and staff — and will help shape what DAT becomes over the "
    "next five years."
)
ed["perks"] = [
    "Compensation range shared with qualified applicants",
    "Open to full-time, fractional, or phased arrangements depending on fit and funding",
    "Remote-first; in-person presence expected for key organizational moments",
    "Creative proximity to a working international theatre company",
    "Benefits and travel expectations discussed during the offer process",
]

# ─── 2. Fix communications-story-lead ────────────────────────────────────────
csl = by_id["communications-story-lead"]
csl["status"] = "coming_soon"
csl["long_description"] = (
    "After twenty seasons of artist-led, community-rooted international theatre-making, "
    "DAT has more stories to tell than infrastructure to tell them. It's time to build that.\n\n"
    "The Communications & Story Lead will shape the editorial and content infrastructure that lets "
    "DAT's work speak — across social media, the alumni storytelling platform, donor communications, "
    "press, and digital campaigns. This is a role for a writer-thinker who can hold DAT's voice "
    "with care while moving fast enough to capture the work as it happens."
)
csl["perks"] = [
    "Compensation commensurate with experience",
    "Remote-first",
    "Direct access to extraordinary stories",
    "Opportunity to travel to a DAT project in the field (subject to production calendar and funding)",
]

# ─── 3. Fix managing-producer ────────────────────────────────────────────────
mp = by_id["managing-producer"]
mp["status"] = "coming_soon"
mp["perks"] = [
    "Compensation commensurate with experience",
    "Creative proximity to a working international theatre company",
    "Remote-first",
    "Opportunity to travel to a DAT project in the field (subject to production calendar and funding)",
]

# ─── 4. Fix development-partnerships-lead ────────────────────────────────────
dpl = by_id["development-partnerships-lead"]
dpl["perks"] = [
    "Compensation commensurate with experience (salary or contract)",
    "Meaningful mission with direct creative proximity",
    "Remote-first",
    "Opportunity to travel to a DAT project in the field (subject to production calendar and funding)",
]

# ─── 5. Fix participant-donor-coordinator ────────────────────────────────────
pdc = by_id["participant-donor-coordinator"]
pdc["status"] = "coming_soon"

# ─── 6. Fix local-project-producer ───────────────────────────────────────────
lpp = by_id["local-project-producer"]
lpp["long_description"] = (
    "DAT's next wave of projects — PASSAGE Slovakia 2026, Drama Club expansions, new community "
    "residencies — each needs a producer on the ground who knows the territory.\n\n"
    "The Local Project Producer is a project-based contract role: you come in for a specific "
    "project, own the local logistics, and leave with a strong credit and a standing invitation "
    "to come back. We're building a bench of project producers across our active hubs as DAT "
    "builds toward Season 21 and beyond."
)
lpp["timeline"] = [
    {"label": "Slovakia 2026", "detail": "Inquiry now; field period July–August 2026"},
    {"label": "Other Hubs", "detail": "Inquire; we'll match you when the right project opens"},
]

# ─── 7. Fix traveling-ensemble-artist → evergreen roster ─────────────────────
tea = by_id["traveling-ensemble-artist"]
tea["title"] = "Traveling Ensemble Artist Roster"
tea["description"] = (
    "Join DAT's artist bench for future international ensemble projects. "
    "Paid when placed on a project; rate varies by project scope and funding. "
    "This is an ongoing roster — not a call for a specific project."
)
tea["season"] = ""
tea["status"] = "evergreen"
tea["is_paid"] = "TRUE"
tea["compensation"] = "Paid when placed; rate varies by project and funding"
tea["featured"] = "FALSE"
tea["deadline"] = ""
tea["long_description"] = (
    "DAT builds ensembles of traveling artists for each major international project — "
    "PASSAGE, ACTion, and CASTAWAY productions. When a new project opens, we draw from this "
    "roster to invite artists into the ensemble. Placement is project-specific and based on "
    "artistic fit, availability, and the needs of each community we’re working with.\n\n"
    "This listing is for the ongoing evergreen roster. If you’re looking for the current open "
    "call — PASSAGE: Slovakia 2026 — see that listing directly."
)
tea["what_youll_do"] = [
    "Devise and perform original work with an international ensemble",
    "Co-lead community workshops with local youth and community members",
    "Adapt your practice to non-traditional performance spaces and cultural contexts",
    "Contribute to documentation and storytelling for the project",
    "Participate in post-residency sharings and presentations",
]
tea["who_you_are"] = [
    "An experienced ensemble performer or devisor",
    "Comfortable working across language and culture",
    "A listener first — genuinely interested in other people’s stories",
    "Ready to be changed by the work",
]
tea["requirements"] = [
    "18 years or older",
    "Valid passport with 6+ months remaining",
    "Experience in devised, physical, or community-engaged performance",
    "Comfortable living and working in ensemble housing",
    "Available to commit to the full in-field window of any project you’re placed on",
]
tea["perks"] = [
    "Paid when placed; artist fee rate confirmed upon engagement",
    "Housing and logistics supported for the in-field period",
    "Portfolio documentation",
    "DAT alumni artist network",
]
tea["timeline"] = [
    {"label": "Applications Reviewed", "detail": "Rolling — we review when new projects open"},
    {"label": "Project-Specific Timelines", "detail": "Shared directly when a match is made"},
]
tea["faq"] = [
    {
        "q": "What’s the difference between this roster and PASSAGE: Slovakia 2026?",
        "a": "PASSAGE: Slovakia 2026 is a specific upcoming project with an artist participation fee model — you pay to participate. The Traveling Ensemble Artist Roster is for future paid ensemble projects where DAT places artists on contract. Apply to both if you’re interested in either.",
    },
    {
        "q": "What does ‘devised’ mean exactly?",
        "a": "We build the piece together from scratch — no pre-existing script. Come with stories, movement, and questions.",
    },
    {
        "q": "How often do ensemble projects happen?",
        "a": "Roughly one to two international ensemble projects per season. DAT is expanding its project calendar as it builds toward Season 21.",
    },
]

# ─── 8. Fix community-partner-liaison ────────────────────────────────────────
cpl = by_id["community-partner-liaison"]
cpl["description"] = (
    "Help DAT understand the community landscape in cities where we work. "
    "A connector role for people with strong local ties who want to support DAT’s "
    "relationship-building — without owning decisions."
)
cpl["long_description"] = (
    "DAT’s partnerships are the arteries of the organization — local drama clubs, community "
    "centers, universities, cultural organizations, arts agencies. The Community Partner "
    "Liaison helps us understand and navigate those landscapes in cities and regions where "
    "we work or plan to work. DAT staff own the formal relationship-building and any "
    "institutional commitments; the Liaison helps us see clearly. "
    "You know the landscape; we’ll give you the context."
)
cpl["what_youll_do"] = [
    "Research and surface relevant organizations, venues, and community contacts in your hub",
    "Attend local arts or community events and share what you learn with the DAT team",
    "Keep a simple running log of promising relationships and local context",
    "Pass along warm introductions between people in your network and DAT staff",
    "Share occasional updates on the arts and community landscape in your region",
]

# ─── NEW: PASSAGE: Slovakia 2026 — Traveling Artist ─────────────────────────
passage_slovakia = {
    "id": "passage-slovakia-2026-artist",
    "title": "PASSAGE: Slovakia 2026 — Traveling Artist",
    "type": "participant",
    "role_types": "ensemble_artist,performer,storyteller",
    "hub": "brno",
    "description": (
        "Travel with a small international ensemble across Slovakia — Bratislava, Košice, "
        "Zemplínska Teplica, and Slovenský Raj — July 12–August 2, 2026. "
        "Create original work shaped by place, encounter, and collective imagination. "
        "An artist participation fee applies."
    ),
    "commitment": "July 12 – August 2, 2026 (22 days in-field)",
    "commitment_type": "short-term",
    "is_paid": "FALSE",
    "compensation": "Artist participation fee applies; amount shared with accepted applicants",
    "status": "open",
    "deadline": "2026-06-15",
    "season": "Season 21",
    "featured": "TRUE",
    "plx_program": "",
    "apply_url": "/apply?opp=passage-slovakia-2026-artist",
    "learn_more_url": "",
    "order": 1,
    "hero_image": "",
    "long_description": (
        "PASSAGE: Slovakia 2026 is an immersive ensemble experience — part artistic journey, "
        "part cultural exchange, part creative development process, part collective making. "
        "A small international ensemble travels together through Slovakia, making original work "
        "shaped by place, encounter, conversation, and imagination.\n\n"
        "The journey runs July 12–August 2, 2026, moving through Bratislava, Košice, "
        "Zemplínska Teplica, and Slovenský Raj. The project culminates in a final shared "
        "performance on August 1 in Košice.\n\n"
        "PASSAGE is not a paid artist gig. It operates on an artist participation fee model — "
        "similar to an international residency or intensive, but in motion and in community. "
        "You contribute to the cost of the ensemble experience; what you make and carry back "
        "is yours. DAT organizes the ensemble, the logistics, the community partnerships, and "
        "the creative framework. You bring your craft, your curiosity, and your willingness to "
        "be changed by what you find."
    ),
    "what_youll_do": [
        "Travel with a small international ensemble through four regions of Slovakia",
        "Make original devised work shaped by place, community encounters, and the journey itself",
        "Participate in workshops, cultural exchanges, and reflection sessions throughout",
        "Contribute to the final shared performance on August 1 in Košice",
        "Document your process through writing, image, or your own artistic lens",
        "Engage genuinely with local artists, youth, and community members along the route",
    ],
    "who_you_are": [
        "A practicing artist — performer, deviser, writer, maker — with ensemble experience",
        "Curious and adaptable across cultural and linguistic contexts",
        "A listener first — genuinely interested in other people’s stories",
        "Ready to make work in motion, without a fixed script or known outcome",
        "Comfortable with shared living and ensemble travel",
    ],
    "requirements": [
        "18 years or older",
        "Valid passport with 6+ months remaining beyond August 2026",
        "Ability to commit to the full in-field window: July 12 – August 2, 2026",
        "Artist participation fee (amount shared with accepted applicants; payment plan available)",
        "Experience in devised, physical, or community-engaged performance preferred",
    ],
    "perks": [
        "22 days of ensemble travel through an extraordinary cultural landscape",
        "Original work made with and for real communities",
        "Portfolio documentation of the journey and final performance",
        "DAT alumni artist network",
        "Creative credit on all PASSAGE: Slovakia 2026 documentation",
    ],
    "timeline": [
        {"label": "Applications Open", "detail": "Now — rolling review"},
        {"label": "Application Deadline", "detail": "June 15, 2026 (or until ensemble is full)"},
        {"label": "Ensemble Decisions", "detail": "By late June 2026"},
        {"label": "Pre-Departure Orientation", "detail": "Online, early July 2026"},
        {"label": "In-Field", "detail": "July 12 – August 2, 2026"},
        {"label": "Final Performance", "detail": "August 1, 2026, Košice"},
    ],
    "faq": [
        {
            "q": "Is this a paid artist job?",
            "a": "No. PASSAGE operates on an artist participation fee model — you contribute to the cost of the ensemble experience. Think of it like an international residency or intensive, but in motion. The fee amount is shared with accepted applicants.",
        },
        {
            "q": "What’s included in the participation fee?",
            "a": "In-country logistics, shared accommodation, ground transport, and production costs for the final performance. International travel to/from Slovakia is not included.",
        },
        {
            "q": "Do I need to speak Slovak?",
            "a": "No. The ensemble works in English with local translation support. Curiosity and warmth carry further than language here.",
        },
        {
            "q": "What kind of work will we make?",
            "a": "Devised, site-responsive, ensemble work — built from scratch on the road. No pre-existing script. Come with stories, questions, and a practice that can travel.",
        },
        {
            "q": "Is housing communal?",
            "a": "Yes. Ensemble housing is shared throughout the journey. If that’s a constraint, reach out and we’ll talk through the options.",
        },
    ],
    "contact_email": "casting@dramaticadventure.com",
}

# ─── NEW: Slovakia 2026 Local Producer ───────────────────────────────────────
slovakia_producer = {
    "id": "slovakia-2026-local-producer",
    "title": "Slovakia 2026 — Local Producer / Ground Coordinator",
    "type": "job",
    "role_types": "arts_admin,community_engagement",
    "hub": "brno",
    "description": (
        "Own the on-the-ground logistics for PASSAGE: Slovakia 2026 (July 12–August 2). "
        "You know Slovakia — its venues, transport, hospitality, and arts landscape. "
        "Project-based contract; urgent hire."
    ),
    "commitment": "May–August 2026 (pre-production + in-field)",
    "commitment_type": "short-term",
    "is_paid": "TRUE",
    "compensation": "Project-based contract fee; rate shared with qualified applicants",
    "status": "open",
    "deadline": "2026-05-31",
    "season": "Season 21",
    "featured": "TRUE",
    "plx_program": "",
    "apply_url": "/apply?opp=slovakia-2026-local-producer",
    "learn_more_url": "",
    "order": 7,
    "hero_image": "",
    "long_description": (
        "PASSAGE: Slovakia 2026 runs July 12–August 2, moving through Bratislava, Košice, "
        "Zemplínska Teplica, and Slovenský Raj. We need someone on the ground in Slovakia who "
        "can own the local logistics — venues, housing, transport, local partnerships, and "
        "day-to-day production reality.\n\n"
        "This is an urgent, time-specific role. Pre-production begins immediately; in-field "
        "dates are July 12–August 2. We need someone who knows Slovakia, can move quickly, "
        "and has a producer’s instinct for solving problems before they become crises."
    ),
    "what_youll_do": [
        "Secure and confirm venues, housing, and transport for all stops on the route",
        "Serve as primary local contact for DAT HQ throughout pre-production and in-field",
        "Coordinate with local community partners, arts organizations, and cultural contacts",
        "Manage the local project budget and logistics timeline",
        "Support artist arrivals, orientations, and day-to-day production needs in the field",
        "Document logistics decisions and local context for DAT’s records",
    ],
    "who_you_are": [
        "Based in Slovakia or with deep working knowledge of the country",
        "A practical, resourceful producer — you’ve managed logistics under pressure",
        "Fluent or highly functional in Slovak (English also required)",
        "Connected to local arts, cultural, or community organizations",
        "Available to commit to the full pre-production and in-field window",
    ],
    "requirements": [
        "Based in Slovakia or able to be fully present there from June onward",
        "2+ years of producing, event management, or project coordination experience",
        "Strong working knowledge of at least two route regions: Bratislava, Košice, Zemplínska Teplica, or Slovenský Raj",
        "References from prior production or community work",
        "Fluency or working proficiency in Slovak",
    ],
    "perks": [
        "Project-based contract fee (rate discussed with qualified applicants)",
        "Housing support during in-field period where applicable",
        "DAT alumni network access",
        "First right of refusal on future DAT projects in Slovakia or Central Europe",
    ],
    "timeline": [
        {"label": "Applications", "detail": "Urgent — apply immediately"},
        {"label": "Decisions", "detail": "By end of May 2026"},
        {"label": "Pre-Production", "detail": "June–July 2026"},
        {"label": "In-Field", "detail": "July 12 – August 2, 2026"},
    ],
    "faq": [
        {
            "q": "How urgent is this?",
            "a": "Very. PASSAGE: Slovakia 2026 runs July 12–August 2. Pre-production needs to begin in June. Please apply now if you’re interested.",
        },
        {
            "q": "Is this a paid role?",
            "a": "Yes. Project-based contract fee; rate shared directly with qualified applicants.",
        },
    ],
    "contact_email": "jobs@dramaticadventure.com",
}

# ─── NEW: Board Committee Member ─────────────────────────────────────────────
board_committee = {
    "id": "board-committee-member",
    "title": "Board Committee Member",
    "type": "volunteer",
    "role_types": "arts_admin,general",
    "hub": "remote",
    "description": (
        "Serve on a DAT Board committee — Finance, Governance, Development, or Artistic Advisory. "
        "Governance-level engagement without full Board commitment. "
        "For people who believe in DAT’s mission and bring relevant expertise."
    ),
    "commitment": "2–4 hrs/month",
    "commitment_type": "flexible",
    "is_paid": "FALSE",
    "compensation": "Volunteer",
    "status": "evergreen",
    "deadline": "",
    "season": "",
    "featured": "FALSE",
    "plx_program": "",
    "apply_url": "/apply?opp=board-committee-member",
    "learn_more_url": "",
    "order": 10,
    "hero_image": "",
    "long_description": (
        "DAT’s Board committees are where mission meets expertise. We’re building committees "
        "in Finance, Governance, Development, and Artistic Advisory — each a focused group "
        "of people who bring real knowledge and care to DAT’s institutional work.\n\n"
        "Committee members are not full Board members. They advise, review, and contribute "
        "on specific questions — without the full fiduciary commitment of Board service. "
        "This is a meaningful, low-overhead way to support an organization doing unusual work."
    ),
    "what_youll_do": [
        "Attend committee meetings (typically 4–6 per year, virtual)",
        "Review materials relevant to your committee’s focus (finance reports, governance docs, grant proposals, etc.)",
        "Provide expert input, ask hard questions, and help DAT think clearly",
        "Connect DAT staff to relevant contacts in your network where appropriate",
        "Support the full Board’s decision-making with committee recommendations",
    ],
    "who_you_are": [
        "A professional with expertise in finance, law, governance, development, or the arts",
        "Genuinely interested in DAT’s mission and the sector it works in",
        "Willing to engage seriously with the organization’s real challenges",
        "No formal governance or Board experience required — orientation provided",
    ],
    "requirements": [
        "18 years or older",
        "Relevant professional or lived expertise",
        "Ability to attend virtual committee meetings (approximately monthly)",
        "Comfort with confidential organizational information",
    ],
    "perks": [
        "Meaningful governance engagement without full Board commitment",
        "DAT community access and invitations to programs",
        "Reference letter available",
    ],
    "timeline": [
        {"label": "Rolling", "detail": "Join a committee anytime — next meeting scheduled upon onboarding"},
    ],
    "faq": [
        {
            "q": "What committees are active?",
            "a": "Finance, Governance, Development, and Artistic Advisory. Tell us your background and we’ll suggest the right fit.",
        },
        {
            "q": "Does this lead to a full Board seat?",
            "a": "It can, but it doesn’t have to. Many committee members stay as committee members indefinitely.",
        },
    ],
    "contact_email": "info@dramaticadventure.com",
}

# ─── NEW: Host Committee Member ───────────────────────────────────────────────
host_committee = {
    "id": "host-committee-member",
    "title": "Host Committee Member",
    "type": "volunteer",
    "role_types": "community_engagement,general",
    "hub": "remote",
    "description": (
        "Lend your name, network, and enthusiasm to a DAT event, campaign, or fundraiser. "
        "Help us reach people we wouldn’t otherwise reach — by making a personal ask, "
        "sharing the event, or simply showing up."
    ),
    "commitment": "1–3 hrs per event or campaign",
    "commitment_type": "one-time",
    "is_paid": "FALSE",
    "compensation": "Volunteer",
    "status": "evergreen",
    "deadline": "",
    "season": "",
    "featured": "FALSE",
    "plx_program": "",
    "apply_url": "/apply?opp=host-committee-member",
    "learn_more_url": "",
    "order": 11,
    "hero_image": "",
    "long_description": (
        "DAT’s host committees are loose, event-specific networks of people who believe in the work "
        "and are willing to say so publicly. For each major event or campaign, we invite a small "
        "group to lend their names, share the event with their networks, and make a personal ask "
        "to a few people they think would care.\n\n"
        "This is not a standing commitment. Each host committee is formed for a specific purpose "
        "and dissolves when the event or campaign ends. You opt in each time."
    ),
    "what_youll_do": [
        "Lend your name to a specific DAT event, fundraiser, or campaign",
        "Share the event with people in your network via email or personal message",
        "Make a personal ask to two or three people you think would genuinely respond",
        "Attend the event or campaign launch where possible",
    ],
    "who_you_are": [
        "Someone who believes in DAT’s work and is willing to say so",
        "Connected to people who might attend, donate, or get involved",
        "Comfortable making a personal (not mass) ask on behalf of something you believe in",
    ],
    "requirements": [
        "No formal requirements — this is about your enthusiasm and your network",
        "Willingness to make a personal ask to at least two or three people",
    ],
    "perks": [
        "Invitations to all DAT events you help host",
        "DAT community access",
        "Recognition in event materials (optional)",
    ],
    "timeline": [
        {"label": "Rolling", "detail": "We invite host committee members on a per-event basis — let us know you’re interested and we’ll reach out when the next one comes together"},
    ],
    "faq": [
        {
            "q": "Is this a recurring commitment?",
            "a": "No. Each host committee is event-specific. You opt in each time — no ongoing obligation.",
        },
        {
            "q": "Do I need to make a donation?",
            "a": "Not required, but appreciated. The most valuable thing is your personal outreach to people who wouldn’t otherwise hear about DAT.",
        },
    ],
    "contact_email": "info@dramaticadventure.com",
}

# ─── NEW: Drama Club Teaching Artist Lead ────────────────────────────────────
dc_ta_lead = {
    "id": "drama-club-teaching-artist-lead",
    "title": "Drama Club Teaching Artist Lead",
    "type": "job",
    "role_types": "teaching_artist,director,community_engagement",
    "hub": "remote",
    "description": (
        "Lead DAT’s teaching artist work in an active Drama Club hub — Slovakia or Ecuador. "
        "Facilitate original storytelling sessions with young people, mentor local teaching artists, "
        "and help a community realize that their stories matter. Project-based contract."
    ),
    "commitment": "One Drama Club season (typically 3–5 months)",
    "commitment_type": "short-term",
    "is_paid": "TRUE",
    "compensation": "Project-based contract fee; rate shared with qualified applicants",
    "status": "coming_soon",
    "deadline": "",
    "season": "Season 21",
    "featured": "FALSE",
    "plx_program": "",
    "apply_url": "/apply?opp=drama-club-teaching-artist-lead",
    "learn_more_url": "",
    "order": 8,
    "hero_image": "",
    "long_description": (
        "DAT’s Drama Clubs exist because young people deserve space to tell their own stories — "
        "and because communities are stronger when those stories are heard.\n\n"
        "The Drama Club Teaching Artist Lead facilitates DAT’s storytelling and devising process "
        "with youth participants in an active hub (currently Slovakia and Ecuador). You’ll run "
        "sessions, mentor local co-facilitators, and help young people develop original work "
        "rooted in their own lives and imagination.\n\n"
        "This is hands-on, relational, creative work. It requires patience, adaptability, "
        "genuine curiosity about young people’s stories, and a practice grounded in community "
        "rather than performance outcome."
    ),
    "what_youll_do": [
        "Facilitate original storytelling and devising sessions with youth participants",
        "Adapt DAT’s methodology to the local context, culture, and age group",
        "Mentor and co-facilitate with local teaching artists and community co-leads",
        "Guide participants from story collection through to performance or sharing",
        "Document sessions and report on participant development to DAT program staff",
        "Coordinate with DAT on session design, arc, and community relationships",
    ],
    "who_you_are": [
        "An experienced teaching artist with a genuine practice in devising or storytelling",
        "Patient, adaptable, and skilled at building trust with young people",
        "Comfortable working across language and culture — ideally with prior cross-cultural experience",
        "Motivated by community impact, not just performance credits",
        "Willing to listen more than you speak, at least at first",
    ],
    "requirements": [
        "2+ years of teaching artist or youth theatre facilitation experience",
        "Experience with devised or community-engaged practice",
        "Ability to commit to the full Drama Club session arc",
        "References from prior teaching artist or community work",
        "For Slovakia hubs: comfort with Central European context; for Ecuador: Spanish proficiency strongly preferred",
    ],
    "perks": [
        "Project-based contract fee (rate discussed with qualified applicants)",
        "Housing support for non-local hires where applicable",
        "Deep creative and community immersion",
        "DAT alumni artist network",
    ],
    "timeline": [
        {"label": "Inquire Now", "detail": "Season 21 Drama Clubs planned for 2026–2027; engagement timing to be confirmed"},
        {"label": "Target Engagement", "detail": "Fall 2026 or Spring 2027 depending on hub"},
    ],
    "faq": [
        {
            "q": "Which hubs are active?",
            "a": "Slovakia and Ecuador are our current active Drama Club hubs. Other hubs may open as DAT builds toward Season 21.",
        },
        {
            "q": "Do I need to speak Slovak or Spanish?",
            "a": "Slovak is helpful but not required for Slovakia hubs — we work with local co-facilitators and translators. Spanish proficiency is strongly preferred for Ecuador.",
        },
    ],
    "contact_email": "casting@dramaticadventure.com",
}

# ─── Assemble final list ──────────────────────────────────────────────────────
final_records = [by_id[r["id"]] for r in records]

lpp_idx = next(i for i, r in enumerate(final_records) if r["id"] == "local-project-producer")
final_records.insert(lpp_idx + 1, slovakia_producer)

tea_idx = next(i for i, r in enumerate(final_records) if r["id"] == "traveling-ensemble-artist")
final_records.insert(tea_idx + 1, passage_slovakia)

final_records.extend([board_committee, host_committee, dc_ta_lead])

# ─── Validation ───────────────────────────────────────────────────────────────
REQUIRED_KEYS = {
    "id","title","type","role_types","hub","description","commitment",
    "commitment_type","is_paid","compensation","status","deadline","season",
    "featured","plx_program","apply_url","learn_more_url","order",
    "hero_image","long_description","what_youll_do","who_you_are",
    "requirements","perks","timeline","faq","contact_email",
}
VALID_TYPES = {"plx","artist","audition","arts_admin","job","volunteer","participant"}
VALID_HUBS = {"nyc","quito","brno","bagamoyo","sydney","remote"}
VALID_COMMITMENTS = {"full-time","part-time","short-term","one-time","flexible"}
VALID_STATUSES = {"open","coming_soon","evergreen","closed"}
VALID_ROLE_TYPES = {
    "actor","performer","singer","storyteller","ensemble_artist","director",
    "designer","teaching_artist","arts_admin","development","marketing",
    "community_engagement","general",
}
BAD_PHRASES = ["season 19","fifteen years","15 years"]

errors = []
ids_seen = set()

for r in final_records:
    rid = r.get("id","?")
    rkeys = set(r.keys())
    missing = REQUIRED_KEYS - rkeys
    extra = rkeys - REQUIRED_KEYS
    if missing: errors.append(f"{rid}: missing keys {missing}")
    if extra: errors.append(f"{rid}: extra keys {extra}")
    if rid in ids_seen: errors.append(f"Duplicate id: {rid}")
    ids_seen.add(rid)
    if r.get("type") not in VALID_TYPES:
        errors.append(f"{rid}: invalid type '{r.get('type')}'")
    if r.get("hub") not in VALID_HUBS:
        errors.append(f"{rid}: invalid hub '{r.get('hub')}'")
    if r.get("commitment_type") not in VALID_COMMITMENTS:
        errors.append(f"{rid}: invalid commitment_type '{r.get('commitment_type')}'")
    if r.get("status") not in VALID_STATUSES:
        errors.append(f"{rid}: invalid status '{r.get('status')}'")
    rts_raw = r.get("role_types","")
    if isinstance(rts_raw, str):
        for rt in [x.strip() for x in rts_raw.split(",") if x.strip()]:
            if rt not in VALID_ROLE_TYPES:
                errors.append(f"{rid}: invalid role_type '{rt}'")
    combined = json.dumps(r).lower()
    for p in BAD_PHRASES:
        if p in combined:
            errors.append(f"{rid}: contains bad phrase '{p}'")

if errors:
    print("VALIDATION ERRORS:")
    for e in errors: print(f"  x {e}")
    sys.exit(1)

print(f"Validation passed: {len(final_records)} records, all clean")

with open(OUTPUT, "w") as f:
    json.dump(final_records, f, indent=2, ensure_ascii=False)
    f.write("\n")

print(f"Written {len(final_records)} records to {OUTPUT}")
print()
print("Summary:")
print(f"  Original: 43 records -> New: {len(final_records)} records (+{len(final_records)-43})")
print()
print("Added:")
print("  passage-slovakia-2026-artist (participant/open — PASSAGE Slovakia July 12-Aug 2)")
print("  slovakia-2026-local-producer (job/open — urgent ground coordinator)")
print("  board-committee-member (volunteer/evergreen)")
print("  host-committee-member (volunteer/evergreen)")
print("  drama-club-teaching-artist-lead (job/coming_soon)")
print()
print("Substantially modified:")
print("  executive-director: 'fifteen years' -> 20th season; stripped overpromised perks")
print("  communications-story-lead: 'fifteen years' -> twenty seasons; status open->coming_soon; perks")
print("  managing-producer: status open->coming_soon; removed 'annual expedition travel' perk")
print("  development-partnerships-lead: removed 'annual expedition travel' perk")
print("  participant-donor-coordinator: status open->coming_soon")
print("  local-project-producer: 'Season 19'->Season 21 language; fixed Slovakia timeline dates")
print("  traveling-ensemble-artist: converted to evergreen roster (no more specific Slovakia details)")
print("  community-partner-liaison: volunteer authority tightened throughout")
