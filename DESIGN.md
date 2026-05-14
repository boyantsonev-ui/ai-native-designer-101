# Design system — AI-Native Designer 101

## Rationale

The course uses an editorial aesthetic modelled on high-quality print design: warm paper tones, a serif/sans type pairing, and a single warm accent (clay). The palette deliberately avoids cold blues and saturated UI chrome — the content is the product. Every component exists to serve reading, not to express technology.

The system has three layers:

1. **Tokens** — CSS custom properties in `:root` (styles.css). Change these to retheme everything.
2. **Components** — reusable React functions in `components.jsx`, each exposed on `window.*`.
3. **Lessons** — authored in `lessons-N.jsx`, composed purely from components and HTML.

---

## Colour tokens

| Token | Value | Use |
|---|---|---|
| `--paper` | `#F0EBDF` | Page background |
| `--paper-2` | `#E9E2D2` | Elevated surfaces (sidebar, cards) |
| `--paper-3` | `#DED3BC` | Pressed / hover state |
| `--ink` | `#1F1E1B` | Primary text, headings |
| `--ink-2` | `#3B3A36` | Body text |
| `--ink-3` | `#6B6A63` | Secondary / metadata text |
| `--ink-4` | `#9A988E` | Disabled, placeholders |
| `--clay` | `#CC785C` | Brand accent — CTAs, active states |
| `--clay-deep` | `#A85A42` | Clay hover / pressed |
| `--moss` | `#5B6A3A` | Success, "done" states |
| `--sky` | `#4A6378` | Informational callouts |
| `--amber` | `#D9A441` | Warnings, Experiment blocks |
| `--plum` | `#7A4A5E` | Spare accent (sparingly) |

Code-surface tokens (`--code-*`) apply only inside Terminal and CodeBlock components.

---

## Typography

| Role | Family | Size |
|---|---|---|
| `--serif` | Source Serif 4 | Display, lede, quiz questions, hero title |
| `--sans` | Geist | UI, body, labels, buttons |
| `--mono` | JetBrains Mono | Eyebrows, metadata, code labels |

**Eyebrow pattern** — all small-caps labels (e.g. lesson group names, component labels) use the `.eyebrow` class: `11px / 0.14em tracking / uppercase / ink-3`. The `::before` pseudo-element draws an 18px rule — override its `background` to tint it for context (clay for actions, amber for experiments, moss for success).

---

## Layout constants

| Token | Value | Use |
|---|---|---|
| `--sidebar-w` | `304px` | Sidebar width (desktop) |
| `--header-h` | `64px` | Sticky top bar height |
| `--max-read` | `760px` | Maximum reading line length |
| `--radius` | `10px` | Default border-radius |

Lesson content lives in `.lesson` (max-width: 860px, auto margins). The reading text inside targets `--max-read` via `p { max-width: var(--max-read) }`.

---

## Component catalogue

### `<HeroCard eyebrow title lede meta[]>`
Dark ink card at the top of Lesson 1. `meta` is an array of short strings rendered as a monospace row. Use once per course, not per lesson.

### `<Callout kind title>`
Inline callout block with a coloured left border. `kind` controls colour and icon:
- `tip` — clay / ✦ — best practice, shortcut
- `note` — sky / i — background info, context
- `warn` — amber / ! — caution, gotcha
- `do` — moss / → — explicit instruction

### `<Quiz question options[] correct explain>`
Self-marking multiple-choice question. Intentionally low visual profile — blends into lesson flow rather than announcing itself as a "test". `correct` is the 0-based index of the right answer. `explain` appears after any selection.

### `<TryIt label? placeholder? defaultPrompt? system? hint?>`
Live Claude call. Styled as an **Experiment** block (amber accent) to signal optional, exploratory work. The subtitle "Design is applied research — take your time with this one." appears automatically. `system` prepends a system context to the user's prompt; `hint` shows a mono label below the header.

### `<Steps items[]>`
Collapsible sequential steps. Each item is `{ label: string, body: ReactNode }`. All steps start expanded; each header is independently toggleable. Use for setup checklists, multi-step processes, or anywhere an ordered list has meaningful sub-content.

### `<Terminal label? lines[] autoplay?>`
Animated terminal mock. Plays line-by-line when scrolled into view. Line kinds: `cmd` (typed), `out` (dim output), `ok` (green), `warn` (amber), `head` (sky), `blank`.

### `<ChatMock messages[] title? status?>`
Static Claude Desktop conversation mock. Message object: `{ role: "user"|"ai", text, tool?, toolCall?: { name, body } }`. Use to illustrate agentic tool-call flows — prefer showing a real, lesson-specific example over a generic one.

### `<CodeBlock lang filename>`
Syntax-highlighted code block on the dark code surface. Wrap content as a template-literal child.

### `<CodeTabs files[]>`
Multi-file code block with tab switcher. Each file: `{ name, lang, code }`.

### `<AgentDiagram kind>`
SVG diagrams for Anthropic agent patterns. Available kinds: `augmented-llm`, `prompt-chain`, `router`, `parallel`, `orchestrator`, `evaluator`, `mcp-bus`, `figma-mcp`, `course-arch`.

---

## File naming

| Pattern | Contents |
|---|---|
| `lessons-1.jsx` | Lessons 1–4 (Intro + Tools) |
| `lessons-2.jsx` | Lessons 5–9 (Foundations + Wiring) |
| `lessons-3.jsx` | Lessons 10–11 (Ship) |
| `lessons-4.jsx` | Lessons 12–13 (Measure + Wrap-up) |
| `lessons-5.jsx` | Lesson 14 (Meta — course architecture) |
| `components.jsx` | All reusable components + SVG diagrams |
| `app.jsx` | Shell, sidebar, routing, state |
| `styles.css` | Single stylesheet — all tokens and component styles |
| `glossary.jsx` | GlossaryModal + CheatSheetModal |
| `feedback.jsx` | FeedbackPanel, AdminDashboard, HITL logic |
| `api/synthesize.js` | Vercel serverless — weekly synthesis via Claude API |
| `api/apply.js` | Vercel serverless — approved proposals → GitHub PR |

### Adding a new lesson

1. Pick the right `lessons-N.jsx` file (or create `lessons-6.jsx` for overflow).
2. Write a `const LessonN = () => ( ... )` function using only components from `components.jsx`.
3. Export it: add to the `Object.assign(window, { ... })` call at the bottom of that file.
4. Register it in the `LESSONS` array in `app.jsx`.
5. No build step — the browser compiles JSX via Babel standalone.

---

## The self-improving loop

Learners submit ratings and chat questions via `<FeedbackPanel>` at the bottom of each lesson. Responses are stored in Supabase. When the unread count crosses a threshold (default: 15), or on the Monday 09:00 cron, `api/synthesize.js` calls the Claude API to cluster feedback into ranked HITL proposals. A human reviews proposals in the admin dashboard (click the brand logo 5× to open). Approved proposals trigger `api/apply.js`, which commits the change and opens a GitHub PR. The course literally edits itself from learner signal.

Lesson 14 ("The course that teaches itself") documents this architecture in full, using the same components taught in earlier lessons.
