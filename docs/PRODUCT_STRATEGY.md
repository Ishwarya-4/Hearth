# Hearth — Product Strategy & Boundary Document

> **The definitive product definition.** This document exists to keep Hearth *warm and
> focused at the same time*: a place full of love for the two of you, that never drifts into
> a cold utility or a feature dump. When in doubt, this document wins.
>
> Companion to `docs/PRODUCT_REDESIGN.md` (the UX/IA redesign). Where the redesign proposed
> an expansive, calendar-led feature set, **this document re-centers on the relationship and
> draws the hard boundary.**

_Status: definitive · Owner: Product · Audience: anyone deciding what to build next_

---

## 0. How to use this document

Hearth is **more than a shared calendar.** It is the private home for the two of you. But
"a place for *everything* between two people" is exactly how products bloat — so the warmth
comes with a strict boundary (§7). Before building anything, it must pass the gate. "More
features" is never the goal. **A warm, coherent place two people return to is the goal.**

Three words on the wall: **Look forward · Stay close · Remember.**

---

## 1. Product Identity

### What Hearth actually is
Hearth is **the private home for the two of you** — one warm place that holds everything
between you across time: the plans you're looking forward to, the closeness of today, and
the memories you keep. The calendar is *how the future shows up* inside it — a capability,
not the identity.

```
   ←  BEHIND            •  NOW  •            AHEAD  →
   Your story           Stay close           Look forward
   (memories you keep)  (today, together)    (plans · countdowns · milestones)
              \______________  the two of you  ______________/
                         your shared, private timeline
```

### Category
Not a calendar app, not a journaling app — a new thing: **the relationship home.** A
private space that holds a couple's whole shared life across past, present, and future.

| Existing tool | What it gives | What it lacks |
|---|---|---|
| Google / Apple Calendar | structured time | cold, solo-first, no memory, no warmth |
| WhatsApp / shared notes | quick coordination | ephemeral, no spine, plans & love get lost |
| Couples apps (Paired, Between) | intimacy prompts | no real calendar, quiz-centric, shallow |
| Journaling (Day One) | beautiful memory craft | solo, no plans, no shared "now" |

The benchmark feeling: **Day One's craft + a calendar's structure + the intimacy of a
shared journal — built for two.**

### The one-sentence answer
> **Hearth is the private home for the two of you — every plan, memory, and little thing
> between you, held in one warm place.**

### The problem it solves better than anyone
A relationship is lived across iMessage, two calendar apps, a camera roll, and memory.
Nothing holds the *whole* of "us." Hearth gives the two of you one private home where the
plan you're excited about, the note you left this morning, and the photo from last summer
all live on the same shared timeline — and quietly become the story of your life together.

### Why use this instead of Google Calendar / WhatsApp / a couples app
Because Hearth is the only place that closes the full loop of a relationship — privately,
warmly, for two:

```
   LOOK FORWARD  →  STAY CLOSE (live it)  →  REMEMBER  →  (resurfaces) → LOOK FORWARD …
```

A calendar drops the moment after the event. A chat thread loses the plan and the memory. A
journal never sees what's ahead. Hearth keeps the whole arc of *us* in one place.

---

## 2. Product Vision

### Vision statement
A world where two people stay close through the ordinary rhythm of a shared life — not
another feed demanding attention, but a warm home they return to together.

### Mission statement
Give every couple one private, beautiful place to look forward together, stay close today,
and keep the story of their life — and let it extend to the people they love most.

### Core philosophy
**Love lives on a timeline.** Everything between two people happens in time — ahead, now, or
behind. Hold all three in one warm place and the relationship has a home.

### Product principles (the rules every feature must obey)
1. **The bond is the point; the shared timeline is the spine.** Every feature must deepen
   the connection between two people *and* sit on the ahead/now/behind timeline.
2. **Warmth over utility.** We will gladly be *less* efficient to be more loving. A feature
   that adds cold convenience but no closeness is Google's job, not ours.
3. **Private, for the two of you.** No followers, no feed, no public, no discovery. Built
   for two (extends to a few). Trust and intimacy are the product.
4. **Loops close.** Prefer features that complete the arc (look forward → live → keep) over
   features that open a new, unrelated one.
5. **Calm, not engagement-maximizing.** Success is two people feeling close — not minutes in
   app. No vanity streaks, no spam, no pressure, no dark patterns.
6. **Couple first, never forked.** Design the heart for two; the same model extends to
   family and close friends by tuning copy and defaults — never by forking the product.
7. **Depth over breadth.** Fewer surfaces, done beautifully. Every feature earns its place
   or is cut.

---

## 3. Product North Star

### The single biggest outcome
A couple for whom Hearth becomes **the home of their relationship** — the place they look
forward from, stay close in, and keep their story — so they return to it, together, for
years.

### The emotion (every single session)
**Loved. Close. Looking forward.** A gentle pull toward your person. Never anxiety, never
obligation, never FOMO.

### The one metric that defines success
**Weekly Connected Couples** — the number of Spaces with ≥2 active members where, in a
7-day window, at least one member **both**:
- *touched the future* (created / edited / RSVP'd a plan, set a countdown), **and**
- *touched closeness* (kept a memory, answered the day's question, left a love note,
  reacted).

This is the right north star because **it is impossible to move without delivering the core
promise** — it forces "looking forward" and "staying close" to stay fused, which is the
whole reason Hearth isn't just a calendar or just a journal.

**Guardrail metrics (watch, but not the north star):**
- *Activated couples* — Spaces with both partners accepted. (Solo = no value.)
- *4-week retention* of Spaces. (Does the home stay warm?)

Everything optimizes for Weekly Connected Couples.

---

## 4. Product Pillars

Three pillars — the three tenses of a shared life — held inside one container: **the two of
you.** Every screen and feature must serve one pillar. If it serves none, it does not belong.

| # | Pillar | Time zone | Destination | The promise |
|---|---|---|---|---|
| **A** | **Look forward together** | Ahead | Calendar | Shared plans, date nights, countdowns, anniversaries & milestones, shared dreams. Anticipation you feel together. |
| **B** | **Stay close today** | Now | Today | The daily home: what's today/next, the day's check-in & mood, your person's presence, and little **love notes** between you. The reason to open it. |
| **C** | **Keep your story** | Behind | Memories | Photos, notes, moods, on-this-day — the timeline of *us*. |

**The container (not a pillar): _The two of you_ — your Space.** The private boundary that
holds A–C: invites, members, the shared world. Couple by default; extends to family / close
friends. It is the vessel, not a tab.

> Naming note: the practical-logistics surface ("Together / lists") is **demoted** from a
> top-level pillar (see §5, §6, §9). It survives only as a light, optional helper — it is
> not what makes Hearth Hearth.

---

## 5. Feature Audit — every current feature, brutally

Verdict key: **CORE** (identity depends on it) · **SUPPORTING** (strengthens, doesn't
define) · **DEMOTE/CUT** · **PARKED** (built/half-built, not earning its place) ·
**NEW** (to build, in-bounds).

### Container — The two of you (Space)
| Feature | Pillar | Verdict |
|---|---|---|
| Spaces + members + roles | container | **CORE.** Couple is the default/hero; the model still holds family/friends. |
| Space types: couple / family / friends / **circle** | container | **SIMPLIFY → 3** (Partner · Family · Friends), with **Partner as the default**. "Circle/someone special" overlaps couple. |
| Email invitations / accept flow | container | **CORE** — the activation gate; must be bulletproof. |
| Onboarding (type → name → color → invite → **seed dates**) | container | **CORE** — default it to the couple story; protect the "seed real dates" step. |
| Presence ("shared today", Your People) | B | **SUPPORTING** — cheap warmth; keep light. |

### Pillar A — Look forward together (Calendar)
| Feature | Verdict |
|---|---|
| Calendar views: day / 3-day / week / month / agenda (5) | **SIMPLIFY → 3** (Month · Week · Agenda). Drop 3-day; fold Day into Week. UI-only — do **not** touch `calendar-utils.ts`. |
| Recurring events | **CORE** (anniversaries, birthdays, date night). |
| RSVP / going-status (`event_attendance`) | **CORE** — a real differentiator for two+. |
| Countdowns (featured next event) | **CORE** magic — expand to explicit milestones. |
| Milestones / anniversaries / "firsts" | **CORE (make first-class)** — central to the love story; today only implicit via recurring events. |
| Bucket-list **dreams** (from the lists feature) | **KEEP, but fold into A** as "shared dreams → plan it." The dreamy half of lists belongs to *looking forward*, not to logistics. |

### Pillar B — Stay close today (Today)
| Feature | Verdict |
|---|---|
| Today dashboard | **CORE** — the home. |
| Daily question + mood + share-then-see (Seal) | **CORE.** The couple intimacy (sealed reveal) is now a *feature, not a bug* — keep it intimate for couples; offer a lighter weekly version for family/friends. |
| "One year ago today" | **CORE** — highest emotional payoff per line of code. |
| **Love notes / little messages between you** | **NEW — high priority.** A small note that lands on your person's Today and can be *kept* as a memory. Bounded: a love-note surface, **not** a chat inbox (see §6). This is the most direct expression of "full of love." |

### Pillar C — Keep your story (Memories)
| Feature | Verdict |
|---|---|
| Memories **timeline** view | **CORE.** |
| Memories **scrapbook** view | **SUPPORTING (cap here).** Second rendering of the same data — pick one default; don't carry both co-equal forever. |
| Memories **map** view (Leaflet + geocode) | **CUT as a primary view (for now).** Heavy; a delight, not a need. Keep storing lat/lng; revisit post-PMF. |
| Add memory: photo + note + mood + date | **CORE** (location optional). |
| `voice_url` (voice memories) | **PARKED** — schema only; build only after photos+notes are loved. |
| `reveal_at` (time capsules) | **PARKED** — schema only; no roadmap commitment. |

### Demoted — practical life (you chose to leave this out of the core)
| Feature | Verdict |
|---|---|
| Together: shared **lists** (groceries / packing / gifts) | **DEMOTE.** Not a top-level pillar. Survives as a light optional helper, most relevant to *family* Spaces — not the couple hero experience. Don't grow it. |
| Together: **bucket lists** | **MOVE → Pillar A** (shared dreams that graduate to plans). |
| Nav copy "Lists **& goals**" | **FIX / REMOVE** — goals don't exist and aren't planned (see §6). |
| Bucket item → calendar event | **KEEP** — on-brand loop (dream → plan), now living under A. |

### Marketing
| Feature | Verdict |
|---|---|
| Landing 3D constellation (R3F / three / drei / gsap / lenis) | **KEEP (marketing only).** Must never bloat the authenticated app bundle. |

---

## 6. Out of Scope — do NOT build (and why)

These are seductive. They are rejected — at least until after product-market fit.

| Tempting feature | Why it's rejected |
|---|---|
| **A chat / messaging inbox** | Love notes ≠ WhatsApp. A full thread turns a warm gesture into another inbox to clear, and we'd lose to chat apps. Keep notes small, kept, and timeline-anchored. |
| **Money / expenses / bill splitting** | You explicitly left "practical life" out of the core. This is the coldest possible utility — it pulls hard away from "full of love." Permanently out (use Splitwise). |
| **Goals & habit tracking / streaks** | Engagement-maximizing, not love. Streaks turn warmth into obligation — violates Principle 5. |
| **AI planning / recaps / gift ideas / smart suggestions** | Cost, latency, complexity, trust questions — and none of it is needed to prove the core loop. Defer hard. (Possible single exception, far later: a yearly recap of *us*.) |
| **Family logistics: chores, kid/dependent profiles** | A different product (Cozi). Cold utility; couple-first identity rejects it. |
| **Dedicated trip planner** | A trip = a date-range plan + a countdown + a few notes. Don't build a sub-app until couples visibly hack it together themselves. |
| **Status / availability ("free tonight", "heads-down")** | Slack presence. Wrong register. |
| **Relationship analytics / insight charts** | Quantifying a relationship feels cold and gamified; needs data we won't have. Long-term at most. |
| **Per-member Timeline lanes & Journey-ribbon calendar views** | The 6th/7th calendar views while we cut to 3. Beautiful, but later. |
| **Anything public — feed, followers, sharing-out, discovery** | Violates Principle 3 permanently. Never built. |

---

## 7. Future Feature Evaluation Framework

Run every idea through this gate. It must pass all "must" questions.

1. **Bond test (must):** Does it deepen the connection between the two of you?
   _Cold utility only → reject._
2. **Timeline test (must):** Does it sit on the shared timeline — ahead, now, or behind?
   _No → reject._
3. **Pillar test (must):** Does it strengthen exactly one of A (Look forward) / B (Stay
   close) / C (Keep your story)? _"None" or "a new pillar" → reject._
4. **Calm & private test (must):** Does it stay calm, pressure-free, and private — no feed,
   no public, no obligation? _Adds vanity/pressure/exposure → reject._
5. **Missed-it test:** Would the two of you genuinely *miss it* if it vanished?
   _No → defer ("later," not "no")._
6. **No-new-surface test:** Can it ship without a new top-level destination and without
   forking per audience? _Needs a new tab or audience fork → very high bar._

**Tiebreaker:** *Does it close a loop we already opened, or open a new one?* **Prefer
closing.**

If an idea passes 1–4, names a pillar, and closes a loop — build it. Fail any of 1–4 and it
does not ship, no matter how clever.

---

## 8. Roadmap — MVP / V2 / Long-term

> Most of MVP is already built. The discipline is to *re-center on the couple*, *cut the
> over-built and off-strategy parts*, *add love notes*, and resist V2/long-term until the
> loop is loved.

### MVP — prove the loop (mostly shipped; finish + re-center)
- Spaces (**3 types, Partner default**) + invite + roles — bulletproof invite/accept
- Calendar: **Month / Week / Agenda**, recurring, RSVP
- **Countdowns + first-class milestone/anniversary tracking**
- Today: dashboard + daily check-in/question + one-year-ago + **simple love notes**
- Memories: **one** primary view, photo + note + mood + date, on-this-day
- Onboarding defaulted to the **couple story**, with **seeded dates**

**MVP cleanup actions:** demote the Together/lists tab (fold bucket-list into Calendar);
cut map as a primary view; collapse memory views to one; drop the 3-day calendar view;
collapse 4 space types → 3 (Partner default); fix "Lists & goals" copy; make milestones
first-class; **build a simple love-notes surface.**

### Version 2 — deepen once retention is proven
- **Attach a memory to an event** ("turn this plan into a memory") — the thesis, embodied
- Reactions on memories, check-ins, and love notes · lightweight realtime presence
- A second memory view (scrapbook) **only if it earns it**
- Milestone celebrations · tasteful reminders/notifications
- Love notes that can be *scheduled* (a note that arrives on a future morning)

### Long-term — only after strong PMF
- Yearly recap of *us* (possibly AI) · map of "our places" · Journey/Timeline views
- Voice memories · deeper conversation prompts · any AI assistance
- Light family/friends-mode polish (the Spaces extension)

---

## 9. Complexity Reduction (concrete cuts)

| Area | Today | Target | Why |
|---|---|---|---|
| Top-level destinations | Today · Calendar · Memories · **Together** (4) | **Today · Calendar · Memories** (3) | One tab per pillar; the bond is the container. Practical lists demote to a helper. |
| Practical lists | First-class "Together" tab | Light optional helper (family Spaces) | You left "practical life" out of the core — honor it. |
| Bucket list | Inside Together | Inside Calendar (shared dreams → plan) | It's *looking forward*, not logistics. |
| Memory views | timeline + scrapbook + **map** | 1 default (+1 alt max) | Three renderings of one dataset; map is heavy. |
| Calendar views | 5 | **Month · Week · Agenda** (3) | Relationship use = overview + what's-next + detail. |
| Space types | 4 | **Partner / Family / Friends**, Partner default | "Circle/someone special" overlaps couple. |
| Compose entry points | RitualSheet · AddMemorySheet · event-dialog · quick-add | **One front door** (quick-add "+") | Avoid competing "compose" mental models. |
| Reflection vs memory | `reflection` vs `note` as separate UX | One model: *a reflection is a kind of memory; the question is a prompt* | Don't make users wonder how "answering" differs from "keeping." |
| Dead schema | `voice_url`, `reveal_at` | Mark parked | Schema shouldn't imply a roadmap. |

---

## 10. Final Product Definition

### One-line elevator pitch
**Hearth is the private home for the two of you — every plan, memory, and little thing
between you, held in one warm place.**

### One-minute explanation
A relationship gets lived across iMessage, two calendar apps, a camera roll, and memory —
and nothing holds the whole of "us." Hearth is one private home for the two of you. It's a
real shared calendar for what you're looking forward to — date nights, trips, the
anniversary you're counting down to — but it's also where you stay close *today* (a daily
check-in, your moods, a little love note that lands on their morning) and where you keep
your story (the photos and notes that quietly become your timeline together). The plan you
made becomes the memory you keep; last year's moment resurfaces to inspire the next one.
It's calm, it's private, it's just for you two — and it grows with the people you love most.

### Complete product definition
Hearth is **the relationship home**: a private place that holds a couple's whole shared life
across three tenses — **ahead** (plans, countdowns, milestones), **now** (a daily home for
closeness — check-ins, moods, love notes), and **behind** (a timeline of photos, notes, and
moments). Its container is the **Space** (couple by default, extensible to family and close
friends). Its defining move is **closing the loop of a relationship** — looking forward →
living it → keeping it — on one warm, private surface. The calendar is a capability inside
the home, not the identity of it.

### Target audience
- **Primary:** couples — the heart of the product, designed for two.
- **Extension:** close families and tight friend groups (same model, tuned copy).
- **Demographic:** roughly 20s–40s, in a relationship, who care about both staying organized
  *and* staying close, and who want to keep their memories.
- **Not for:** enterprise scheduling, solo productivity, or anyone wanting public/social.

### Emotional value
Feeling **loved, close, and looked-forward-to** — the warm reassurance of a private home
for your life with your person.

### Practical value
- One place for your shared plans — no scattered texts or two separate calendars.
- Never miss the dates that matter to the two of you.
- A daily reason to feel close, and a timeline of your story that builds itself.

### Unique value proposition
**Hearth is the only place that holds the whole of "us" — what you're looking forward to,
how close you feel today, and the story you're keeping — private, warm, and built for two.**

---

## 11. The boundary, in one breath

> Hearth is **the private home for the two of you** — three pillars on one shared timeline:
> **Look forward · Stay close · Remember.** If an idea doesn't deepen the bond between two
> people, doesn't live on that timeline, isn't calm and private, and doesn't slot into one
> of the three pillars, **it does not ship** — however clever it sounds. The calendar is how
> we hold the future; love is the reason we hold any of it.
</content>
