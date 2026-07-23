# Hearth — Brand & Design Rules

> **The design layer.** `docs/PRODUCT_STRATEGY.md` decides *what we build and for whom*; this
> document decides *what it looks and sounds like*. Where the two ever disagree on identity,
> PRODUCT_STRATEGY.md wins.
>
> Everything below is **what actually ships** — token values are read from `src/styles.css`,
> not aspirational. If you change a token, change this file in the same commit.

_Status: definitive (design) · Companion to `docs/PRODUCT_STRATEGY.md`_

---

## 1. The one rule that matters: violet vs. ember

Hearth ships two brand hues, and the whole system falls apart the moment they're used
interchangeably. They are not two accent colors — they are two **registers**.

| Token | Value (light) | Means | Use for |
|---|---|---|---|
| `--hearth` | `oklch(0.56 0.19 280)` periwinkle | **"this does something"** | Every functional affordance: focus rings, active nav, links, RSVP state, selected days, chart-1, the primary CTA gradient. |
| `--ember` | `oklch(0.72 0.16 55)` warm amber | **"this is felt"** | Warmth only: ritual and check-in moments, countdowns, milestones, love notes, ambient washes. |

### The rule

> **Violet carries the action. Ember carries the feeling. Ember never fills a plain control
> on its own.**

Concretely:

- ✅ Ember as **atmosphere** — `bg-gradient-radial-ember` behind the welcome hero.
- ✅ Ember as **the warm tail of a violet gradient** — `.btn-ember` runs `--hearth` → `--ember`,
  so the button reads violet-led with warmth at the edge.
- ✅ Ember as **emphasis on an emotional object** — a milestone badge, a countdown number.
- ❌ Ember as a **solid fill on a utility button** — Save, Cancel, Add, Filter, Sign in.
- ❌ Ember for **state that means "something is wrong"** — that's `--destructive`.

This maps directly onto the product pillars: Pillar A (Look forward) and the app chrome are
violet; the emotional beats of Pillar B (Stay close) and Pillar C (Keep your story) are where
ember is allowed to show up.

### Known subtlety: `--primary` is not `--hearth`

`--primary` is **ink** (`oklch(0.21 0.014 285)` in Morning, near-white in Evening), not violet.
So `bg-primary` renders a near-black button — this is intentional and it's why the app reads
"quiet and modern" rather than purple-washed. Violet is an **accent**, not a fill.

If you want the violet-led CTA, use `.btn-ember`. If you want the calm default action, use
`bg-primary`. Don't reach for `bg-hearth` on a button surface.

### Every hue is theme-scoped

`--hearth` and `--ember` are re-declared by `.dark` and `.moonstone`. **Never hardcode an
oklch literal for either one** — it will silently drift in Evening mode and on the Today
stage.

| | Morning (`:root`) | Evening (`.dark`) | Moonstone (Today) |
|---|---|---|---|
| `--hearth` | `0.56 0.19 280` | `0.74 0.155 284` | `0.52 0.18 286` |
| `--ember` | `0.72 0.16 55` | `0.78 0.14 58` | `0.72 0.13 60` |

> ⚠️ Hand-written CSS in `styles.css` must reference the **raw** token (`var(--hearth)`,
> `var(--foreground)`) — never the Tailwind alias (`var(--color-foreground)`), which only
> resolves on `<html>` and breaks inside `.moonstone` / `.cinema-void`.

---

## 2. Type

Two families ship, and — like the colors — they carry different registers.

| Token | Family | Register | Where |
|---|---|---|---|
| `--font-sans` / `--font-display` | **Plus Jakarta Sans** | The product speaking | All UI, headings, countdowns, numerals |
| `--font-serif` | **Fraunces** (italic) | **The person speaking** | Love-note bodies, kept notes, `.text-serif-display` |

The important distinction: **Fraunces is not our display face — it's the voice of the user.**
When you see italic serif in Hearth it should always mean *a human wrote this to another
human*. Setting a nav label or a dialog title in Fraunces breaks that signal, which is why
`--font-display` is Jakarta and not the serif.

Numerals in countdowns and dates use `tabular-nums` so they don't jitter as they tick down.

---

## 3. Shape & surface

- `--radius: 0.75rem` is the base; the scale runs `sm` (−4px) → `3xl` (+14px).
- Cards and panels sit at `--radius-xl`; pills and avatars go fully round.
- Elevation is `shadow-elevated` — a tight 1px shadow plus a wide soft one plus an inset
  hairline. Depth comes from **blur and inset light**, not from dark borders.
- Glass (`.hearth-glass`) is for chrome that floats over content (mobile nav, sheets). Never
  stack glass on glass.

---

## 4. Modes are times of day, not settings

The two themes are named **Morning** and **Evening**, not "light" and "dark" — in the UI and
in code comments alike.

This is small, but it's the whole voice principle in one word: Hearth describes when you are,
not what setting you toggled.

### Three stages, and the rule that keeps them honest

The app is not one canvas. There are three, each of which re-declares the token set:

| Stage | Where | Themeable? |
|---|---|---|
| Default (`:root` / `.dark`) | dialogs, anything outside a stage | Yes |
| **Moonstone** (`.moonstone`) | all four authenticated destinations | Yes — `.moonstone` + `.dark .moonstone` |
| **Cinema void** (`.cinema-void`) | `/` and `/auth` | **No, deliberately** — pinned light |

> **Any selector that pins a stage's palette must ship its Evening counterpart in the same
> commit.** A stage class outranks `.dark` on `<html>` (`.moonstone` and `.dark` are both
> specificity 0,1,0, and `.moonstone` is declared later) — so an unpaired stage silently
> swallows the theme toggle for every route it covers.

The same applies to any hand-written rule that hardcodes a surface color rather than reading
a token: frosted-white glass (`.memory-card`, `.hearth-glass`, `.moonstone-chrome`) needs a
`.dark …` twin, or it renders a near-white panel carrying near-white token text.

**Prefer reading a token to hardcoding a color.** Hardcode only for materials tokens can't
express — glass alpha, gradient stops, inset light — and then always in pairs.

---

## 5. Voice & tone

Principle 2 of the strategy doc is *warmth over utility*. In copy that means:

**Write like a person who knows them. Never like a system reporting state.**

| Instead of | Write |
|---|---|
| "No upcoming events found." | "Nothing planned — want to make a little plan, or just say hi?" |
| "No memories match these filters." | "Nothing here with these filters on — try widening them a little." |
| "0 items" | "Nothing here yet — a little quiet is nice too." |
| "Error: failed to save" | "That didn't save. Want to try again?" |
| "Invite sent successfully." | "Sent. Now the waiting-by-the-door part." |

### Rules

1. **An empty state is never a failure.** It's an invitation, or it's permission to have a
   quiet day. Every empty state offers a next step *or* reassures — ideally both.
2. **Second person, and "the two of you."** "Your person," "you two," "together." Never
   "users," "members" (in user-facing copy), or "the space."
3. **No exclamation marks, no streaks, no urgency.** Principle 5 is *calm, not
   engagement-maximizing.* Copy that pressures is copy that ships a different product.
4. **Lowercase warmth, sentence case everywhere.** No Title Case Buttons.
5. **Say the small thing.** "3 years together" beats "Anniversary — 3." The number is the
   fact; the phrasing is the feeling.
6. **Errors apologize once and offer the door.** Never blame, never stack-trace at a couple.

---

## 6. Naming inside the codebase

The product was briefly called something else, and the residue was actively confusing:
`src/components/amber/` collided with the real `--ember` color token, and its `EmberButton`
rendered `bg-primary` (ink) — a component named for a color it never used.

Current state:

| Was | Now | Why |
|---|---|---|
| `src/components/amber/` | `src/components/closeness/` | Holds the Pillar B "stay close" surfaces — love notes, ritual, mood, presence, seal. No token collision. |
| `EmberButton` | `PrimaryButton` | It renders `bg-primary`. Name it what it is. |
| `.btn-ember` | *(kept)* | Genuinely a violet→ember gradient, so the name is accurate. Now token-driven. |

**Rule going forward:** a component may only be named for a color token if it actually
renders that token.

---

## 7. Motto

The strategy doc has an elevator pitch; this is the short line for surfaces where only a few
words fit.

> **More than dates. A home for your shared life.**

Alternate, for contexts that need the loop stated: *"Plan it together. Keep it forever."*

**Rejected:** *"The calendar that remembers."* It's a good line and it's the wrong one — it
leads with calendar, and PRODUCT_STRATEGY.md §1 is explicit that the calendar is a capability
inside the home, not the identity of it. Leading as a calendar wins a moment of comprehension
and loses the category.

---

## 8. Checklist before shipping a screen

- [ ] Ember appears only on something felt, never on a plain control.
- [ ] No hardcoded oklch for `--hearth` / `--ember`; raw `var(--…)`, not `--color-…`.
- [ ] Fraunces only where a human wrote the words.
- [ ] Every empty state invites or reassures.
- [ ] No exclamation marks, no streaks, no Title Case.
- [ ] Every hardcoded surface color has a `.dark` twin — check it in both Morning and Evening.
- [ ] It looks right on whichever stage it lives on (Moonstone for the app, Cinema void for
      landing/auth), in both times of day.
