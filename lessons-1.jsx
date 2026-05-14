// Lessons 1-4 — Foundations + Tools

const Lesson1 = ({ onNavigate }) => (
  <>
    <HeroCard
      eyebrow="Course"
      title="The future of designers."
      lede="You'll go from clicking buttons in Figma to orchestrating agents that build, deploy, and measure your prototypes — in your own voice."
      meta={["14 lessons", "Mixed / hands-on", "Updated May 2026"]}
    />

    <p className="lede">
      Design used to mean static frames handed to engineers. Today, an AI-native designer is a <em>director</em> — they describe intent, supply taste, and let agents do the production. This course teaches you the stack.
    </p>

    <section>
      <h3>What you'll be able to do</h3>
      <div className="two-col">
        <div className="cheat-card" data-nav onClick={() => onNavigate && onNavigate(2)}><h5>Run Claude as a teammate</h5><p>Use Claude Desktop and Claude Code as collaborators, not search engines.</p></div>
        <div className="cheat-card" data-nav onClick={() => onNavigate && onNavigate(4)}><h5>Author your own Skills</h5><p>Package your taste into reusable instruction modules Claude loads on demand.</p></div>
        <div className="cheat-card" data-nav onClick={() => onNavigate && onNavigate(6)}><h5>Compose agents + sub-agents</h5><p>Apply Anthropic's patterns: workflows for control, agents for autonomy.</p></div>
        <div className="cheat-card" data-nav onClick={() => onNavigate && onNavigate(8)}><h5>Wire MCP servers</h5><p>Plug Figma, GitHub, Vercel, PostHog, Clarity, Hotjar into one chat.</p></div>
        <div className="cheat-card" data-nav onClick={() => onNavigate && onNavigate(11)}><h5>Ship to production</h5><p>From local prototype → GitHub → Vercel preview URL in one prompt.</p></div>
        <div className="cheat-card" data-nav onClick={() => onNavigate && onNavigate(12)}><h5>Measure what people do</h5><p>Pull behavioural data back into Claude and iterate from real signal.</p></div>
      </div>
    </section>

    <Callout kind="note" title="A note on tone">
      We'll alternate between <em>concept</em> (5 min of why) and <em>craft</em> (5 min of how). Skip what you know; the sidebar tracks your progress.
    </Callout>

    <section>
      <h3>The shape of the new toolkit</h3>
      <p>Three layers are converging into a designer's daily workflow:</p>
      <AgentDiagram kind="mcp-bus" />
      <p style={{ marginTop: 16 }}>
        At the top — <strong>a host</strong> that talks to you (Claude Desktop, Claude Code). In the middle — <strong>a protocol</strong> that lets that host call any tool (MCP). At the bottom — <strong>your existing tools</strong>, now reachable by language. Once you see this picture, every other lesson is a footnote.
      </p>
    </section>

    <Quiz
      question="Which of these best describes the designer's new role?"
      options={[
        "Replace engineers and ship code yourself",
        "Direct agents — describe intent, supply taste, verify output",
        "Avoid AI tools to keep work pure",
        "Use Claude only as a faster search bar",
      ]}
      correct={1}
      explain="The leverage isn't in typing — it's in clearly stated intent, sharp taste, and judgment over what ships."
    />
  </>
);

const Lesson2 = () => (
  <>
    <div className="eyebrow">Lesson 02 · Tools</div>
    <h1 style={{ marginTop: 14, marginBottom: 18 }}>Three surfaces — Chat, Cowork, Code</h1>
    <p className="lede">
      The Claude desktop app has three modes at the top of every window: <strong>Chat</strong>, <strong>Cowork</strong>, and <strong>Code</strong>. Each sits at a different point on the control spectrum — from pure conversation to fully autonomous action. Knowing which to reach for is half the skill.
    </p>

    <section>
      <h3>The three modes at a glance</h3>
      <div className="two-col" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="cheat-card">
          <h5>Chat</h5>
          <p>Conversational. You ask, Claude replies. Great for thinking, critique, strategy, copy, and image review. Context resets each session unless you're in a Project.</p>
        </div>
        <div className="cheat-card">
          <h5>Cowork</h5>
          <p>Collaborative. Claude works <em>alongside</em> you with tools — it can read files, call APIs, and take actions, but you're directing at every step. The pair-programming feel.</p>
        </div>
        <div className="cheat-card">
          <h5>Code</h5>
          <p>Agentic. Claude runs a loop — plan, act, observe, repeat — on your repo autonomously. You approve the plan; it executes. Lesson 3 covers this in depth.</p>
        </div>
      </div>
      <Callout kind="note" title="Same app, three gears">
        You switch modes with one click. The MCP servers, Projects, and Routines you configure are available across all three — the mode only changes how autonomous Claude is, not what it can reach.
      </Callout>
    </section>

    <section>
      <h3>Chat — the thinking partner</h3>
      <p>
        Chat is the conversational mode. Every session has four active layers you can see and control:
      </p>
      <div className="two-col">
        <div className="cheat-card">
          <h5>Context window</h5>
          <p>Everything in the current conversation — your messages, Claude's replies, tool results, attached files. Resets each new session unless you're in a Project.</p>
        </div>
        <div className="cheat-card">
          <h5>System prompt</h5>
          <p>Set by your Project Instructions or a Skill. Invisible to the thread but shapes every reply — your voice, principles, and constraints.</p>
        </div>
        <div className="cheat-card">
          <h5>Attached files & images</h5>
          <p>Drag PDFs, screenshots, Figma exports, or CSVs straight into the chat. The context window <em>is</em> the upload — no separate file UI needed.</p>
        </div>
        <div className="cheat-card">
          <h5>Connected tools (MCP)</h5>
          <p>When a server is connected, Claude sees its tools alongside your message. It calls them silently when relevant — you see the result, not the plumbing.</p>
        </div>
      </div>
    </section>

    <section>
      <h3>Projects — a brief that compounds</h3>
      <p>
        A Project is a named container for related sessions, with shared <strong>Project Instructions</strong> — a system prompt every chat in that project inherits. Write it once; Claude reads it at the start of every session. Update it as the brief evolves.
      </p>
      <div className="two-col">
        <div className="cheat-card">
          <h5>What to pin in Project Instructions</h5>
          <p>Design principles, voice guide, brand colors (hex), component-naming conventions, current sprint goal, Figma file link, stakeholder names.</p>
        </div>
        <div className="cheat-card">
          <h5>What Projects are not</h5>
          <p>Not auto-growing memory. Claude doesn't write your instructions for you — you write them. The context resets each session; the instructions do not.</p>
        </div>
      </div>
      <CodeBlock filename="Project Instructions — Acme / Onboarding" lang="md">
{`# Acme — Onboarding redesign

## Product context
B2B SaaS, 3 user types: Admin, Member, Viewer.
Current sprint goal: reduce step-2 drop-off from 43% → < 20%.

## Voice
Plain, direct, warm. No marketing tics ("seamlessly", "unleash").
Lead with the verb. Name the trade-off; don't hide it.

## Figma
Main file: https://figma.com/file/... (Onboarding v4)
Tokens: spacing-4=4px, clay=#CC785C, --text-primary=#1F1E1B

## Conventions
Components: PascalCase. CSS: kebab-case. Props: camelCase.
Icons: always from @acme/icons. Never inline SVG.

## Don't touch
The auth flow (screens 1–2) is locked pending legal review.`}
      </CodeBlock>
      <Callout kind="do" title="One project per product area, not per task">
        Create a project for "Design system", one for "Onboarding", one for "Q3 growth". Sessions accumulate inside each. The instructions are the growing brief — you own them.
      </Callout>
    </section>

    <section>
      <h3>Cowork — Claude as a co-worker, not a chatbot</h3>
      <p>
        Cowork is the middle mode: Claude has tools and can take actions, but the interaction stays close and conversational — you're directing step by step, not handing off a full brief. Think of it as the difference between <em>asking someone a question</em> (Chat) and <em>working side-by-side at the same desk</em> (Cowork).
      </p>
      <p>
        In Cowork, Claude can open files, call your connected MCP servers, iterate on content, and show you intermediate results — all within a single flowing session. You see every action as it happens and can redirect at any point.
      </p>
      <div className="two-col">
        <div className="cheat-card">
          <h5>Good for Cowork</h5>
          <p>Iterating on a Figma component with live feedback · reviewing a PR diff together · refining copy through several rounds · building a config file step by step.</p>
        </div>
        <div className="cheat-card">
          <h5>Not the right mode when…</h5>
          <p>The task is purely conversational (use Chat) · or the task is "go build the whole feature" (use Code — Lesson 3). Cowork is for tasks you want to <em>steer</em> as they happen.</p>
        </div>
      </div>
      <ChatMock
        title="Claude · Cowork mode"
        messages={[
          { role: "user", text: "Let's work through the onboarding copy together. Start with screen 2 — the 'Tell us about yourself' form." },
          { role: "ai",
            toolCall: { name: "figma.get_node('Onboarding v4 / Screen 2')", body: "→ 3 fields: Company name, Size, Role" },
            text: "I pulled the frame. The heading 'Tell us about yourself' is vague — it doesn't say why we need this or what it unlocks. Suggestion: 'Set up your workspace (30 seconds)' + one line of value copy above the fields. Want me to draft three options?" },
          { role: "user", text: "Yes — and keep the tone direct, no fluff." },
          { role: "ai", text: "Option A: 'Set up your workspace · We'll skip the generic defaults.' Option B: 'Three fields. One setup. Done.' Option C: 'Your workspace, your rules — let's configure it.' I'd go with A — it names the benefit without overselling. Which direction?" },
        ]}
      />
    </section>

    <TryIt
      label="Try it — get a critique on something you're working on"
      placeholder="Paste a problem statement, a flow description, or a paragraph of UX copy…"
      defaultPrompt="Critique this onboarding microcopy. Point out friction, vagueness, or weak verbs. Be specific.\n\n'Welcome! Tell us a bit about yourself so we can personalize your experience. We just need a few details.'"
      hint="↳ runs in your browser"
    />

    <Quiz
      question="What's the key difference between Chat mode and Cowork mode?"
      options={[
        "Cowork uses a more powerful model",
        "Chat is for short messages; Cowork is for long ones",
        "Cowork lets Claude use tools and take actions while you steer each step — Chat is pure conversation",
        "Cowork requires a paid plan; Chat is free",
      ]}
      correct={2}
      explain="Cowork is the collaborative middle ground: Claude has tools and can act, but you're directing closely at every step — not handing off an autonomous task."
    />
  </>
);

const Lesson3 = () => (
  <>
    <div className="eyebrow">Lesson 03 · Tools</div>
    <h1 style={{ marginTop: 14, marginBottom: 18 }}>Claude Code — pair-coding without code</h1>
    <p className="lede">
      Claude Code is a terminal-native agent. You point it at a folder, describe an outcome, and it reads, edits, runs, and commits. For designers, it's the bridge from a Figma idea to a working prototype URL — without translating to engineer.
    </p>

    <section>
      <h3>The 90-second mental model</h3>
      <p>Claude Code runs an <em>agent loop</em>: read your repo, propose a plan, run tools (read files, write files, run commands), check results, iterate. You stay in the loop — approving plans, redirecting at branches.</p>
      <AgentDiagram kind="agent-loop" />
    </section>

    <section>
      <h3>A typical session, end to end</h3>
      <Terminal
        label="claude — ~/projects/onboarding-prototype"
        lines={[
          { kind: "cmd", text: "claude" },
          { kind: "head", text: "● Claude Code v2.4.1" },
          { kind: "out", text: "Working in ~/projects/onboarding-prototype" },
          { kind: "blank" },
          { kind: "cmd", text: "build me an onboarding flow from the figma file 'Onboarding v3' — 4 screens, mobile, react" },
          { kind: "out", text: "Plan:" },
          { kind: "out", text: "  1. Pull frames from Figma (figma-mcp)" },
          { kind: "out", text: "  2. Generate Screen.jsx for each, share UI primitives" },
          { kind: "out", text: "  3. Wire React Router for the flow" },
          { kind: "out", text: "  4. Run dev server, screenshot, verify" },
          { kind: "out", text: "Approve? (y/n)" },
          { kind: "cmd", text: "y" },
          { kind: "ok",  text: "✓ Pulled 4 frames from Figma" },
          { kind: "ok",  text: "✓ Wrote 6 files, 312 lines" },
          { kind: "ok",  text: "✓ npm run dev → http://localhost:5173" },
          { kind: "out", text: "Open the preview to compare with the Figma. Want me to deploy a Vercel preview?" },
        ]}
      />
    </section>

    <Callout kind="warn" title="Stay in the driver's seat">
      Always read the plan before approving. Claude Code is fast, which means a vague prompt scaffolds a vague product just as fast. Spec like a brief, not a wish.
    </Callout>

    <section>
      <h3>Managing your session</h3>
      <p>Claude Code keeps a running transcript of every session. Four commands let you control how much of that history stays in the context window — and how to get it back.</p>
      <div className="two-col">
        <div className="cheat-card">
          <h5><code>/clear</code></h5>
          <p>Wipes the conversation history entirely. Near-zero context; maximum headroom. Use this when you finish a task and start something unrelated.</p>
        </div>
        <div className="cheat-card">
          <h5><code>/compact [focus]</code></h5>
          <p>Summarizes the full history into ~4k tokens, then continues. A 70k-token session compresses to ~4k. Pass an optional focus to steer the summary: <code>/compact Focus on the auth module</code>.</p>
        </div>
        <div className="cheat-card">
          <h5><code>/resume</code></h5>
          <p>Shows saved past sessions from <code>~/.claude/projects/</code> — with size and age — so you can pick up exactly where you left off. From the CLI: <code>claude -c</code> resumes the most recent.</p>
        </div>
        <div className="cheat-card">
          <h5><code>/context</code></h5>
          <p>Renders your current context usage as a colored grid broken down by system prompt, messages, and tool outputs. Your "fuel gauge" before a long task.</p>
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16, fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            <th style={{ textAlign: "left", padding: "6px 12px 6px 0", color: "var(--text-2)" }}>Situation</th>
            <th style={{ textAlign: "left", padding: "6px 0", color: "var(--text-2)" }}>Command</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["Finished a task, starting something new", "/clear"],
            ["Mid-task, context getting large, want to keep going", "/compact"],
            ["Want to pick up an old session", "/resume"],
            ["Curious how full your context is", "/context"],
          ].map(([situation, cmd]) => (
            <tr key={cmd} style={{ borderBottom: "1px solid var(--border-subtle, var(--border))" }}>
              <td style={{ padding: "8px 12px 8px 0", color: "var(--text-1)" }}>{situation}</td>
              <td style={{ padding: "8px 0" }}><code>{cmd}</code></td>
            </tr>
          ))}
        </tbody>
      </table>

      <Callout kind="warn" title="Don't wait for auto-compact">
        <p style={{ margin: 0 }}>Claude Code auto-compacts when the context hits ~95% capacity. Letting it get there is risky — the emergency summary can drop critical decisions mid-task and cause the agent to spiral. Check <code>/context</code> periodically and <code>/compact</code> manually while you still have control.</p>
      </Callout>
    </section>

    <section>
      <h3>When Desktop vs Code?</h3>
      <div className="two-col">
        <div className="cheat-card"><h5>Reach for Desktop</h5><p>Thinking, critique, copy, brand work, strategy, image review, Slack-shaped tasks.</p></div>
        <div className="cheat-card"><h5>Reach for Code</h5><p>Anything that touches a file: prototypes, design tokens, MDX content, deploys.</p></div>
      </div>
    </section>

    <section>
      <h3>CLAUDE.md — your project brief for Code</h3>
      <p>
        Desktop has Project Instructions. Code has <strong>CLAUDE.md</strong> — a markdown file you place at the root of any repo. Claude Code reads it automatically at the start of every session. It's the project brief that tells Code what it's working in, what to avoid, and how to behave.
      </p>
      <p>
        The difference: Project Instructions live in Claude Desktop and shape your <em>conversations</em>. CLAUDE.md lives in your repo and shapes Code's <em>actions</em> on that codebase.
      </p>
      <CodeBlock filename="CLAUDE.md" lang="md">
{`# AI-Native Designer 101 — course repo

## Tech stack
React 18 via CDN (no build step). JSX transpiled by Babel standalone.
All lessons are .jsx files loaded as <script type="text/babel">.

## File structure
lessons-1.jsx   → Lessons 1–4  (intro + tools)
lessons-2.jsx   → Lessons 5–9  (foundations + wiring)
lessons-3.jsx   → Lessons 10–13 (ship + measure)
feedback.jsx    → Learning loop (feedback panel, admin dashboard)
app.jsx         → Shell (sidebar, navigation, state)
styles.css      → Single stylesheet (design tokens at :root)

## Dev workflow
Open index.html via a local static server (npx serve . -p 4200).
No npm run dev. No build step. Changes are live on page reload.

## Conventions
- Components: PascalCase. CSS classes: kebab-case.
- All lesson components exported via Object.assign(window, {...}).
- New CSS goes at the end of styles.css, not inline.

## Don't touch
- The CDN integrity hashes in index.html — leave them as-is.
- The STORAGE_KEY "ai-native-designer-101::v2" in app.jsx.`}
      </CodeBlock>
      <Callout kind="do" title="Write CLAUDE.md before writing any prompt to Claude Code">
        Without it, Claude Code makes sensible-but-wrong decisions — using a package manager that doesn't apply, assuming a build step that doesn't exist, choosing file paths that break imports. CLAUDE.md is 5 minutes that saves an hour of correction.
      </Callout>
    </section>

    <section>
      <h3>Routines — repeating work, without repeating yourself</h3>
      <p>
        In the Claude Code desktop app, <strong>Routines</strong> is a first-class sidebar item — the same level as New session and Customize. A routine is a <code>.md</code> file in <code>.claude/commands/</code> with a <code>schedule:</code> cron field. Claude Code executes it on schedule — or on demand from the Routines panel — without a third-party service, webhook, or CI pipeline. You write the task once; Claude runs it on the clock.
      </p>
      <CodeBlock filename=".claude/commands/weekly-audit.md" lang="md">
{`---
description: Weekly design audit — checks for Figma drift, token mismatches,
  and accessibility regressions against the latest Vercel deploy.
schedule: 0 9 * * MON
output: .claude/outputs/weekly-audit-{{date}}.md
---

# Weekly design audit

## Context
Read the Figma file from the Project Instructions.
Read the latest Vercel preview URL from the last deploy log.

## Steps
1. Pull all frames tagged "production-ready" from Figma.
2. Screenshot the equivalent pages on Vercel via figma-console.
3. Compare token values (spacing, color, typography) frame by frame.
4. Flag drift as: trivial / minor / major.
5. Write the report to the output file.

## Output format
- Executive summary (2 sentences)
- Drift table: Frame | Token | Figma | Prod | Severity
- Recommended fixes, ordered by severity`}
      </CodeBlock>

      <Terminal
        label="claude — ~/projects/acme"
        lines={[
          { kind: "cmd", text: "claude run weekly-audit" },
          { kind: "head", text: "● Running command: weekly-audit" },
          { kind: "out", text: "Schedule: 0 9 * * MON  (next run: Mon 09:00)" },
          { kind: "blank" },
          { kind: "out", text: "Loading Figma file…" },
          { kind: "ok",  text: "✓ Pulled 18 production-ready frames" },
          { kind: "out", text: "Screenshotting Vercel preview…" },
          { kind: "ok",  text: "✓ 18 pages captured via figma-console" },
          { kind: "out", text: "Comparing tokens…" },
          { kind: "ok",  text: "✓ 3 drift points found (1 minor, 2 trivial)" },
          { kind: "ok",  text: "✓ Report → .claude/outputs/weekly-audit-2026-05-12.md" },
          { kind: "out", text: "Done in 38s." },
        ]}
      />

      <p style={{ marginTop: 16 }}>
        Once the file is in <code>.claude/commands/</code>, it appears in the <strong>Routines</strong> panel in the Claude Code desktop sidebar. You can trigger it manually from there, see its last run, and read its output — no terminal needed. To wire the schedule without editing the frontmatter by hand, ask Claude in Cowork mode: <em>"Schedule my weekly-audit routine for every Monday at 9am."</em>
      </p>

      <Callout kind="do" title="This course runs a routine on itself">
        The feedback you leave at the bottom of each lesson is exported as JSON and processed by a weekly routine — <code>feedback-synthesis.md</code> — which runs in the Routines sidebar. It produces the HITL proposals visible in the Admin Dashboard (click the brand logo 5× to open it, then go to Automations). You are looking at a routine's output right now.
      </Callout>
    </section>

    <Callout kind="note" title="Skills vs Routines — know the difference">
      <p style={{ margin: 0 }}>
        A <strong>Skill</strong> is loaded by Claude when it matches your intent — you don't invoke it, Claude does. A <strong>Routine</strong> is invoked by you or a schedule — Claude doesn't decide when to run it. <em>Skills encode taste. Routines encode recurring work.</em> Next lesson covers Skills.
      </p>
    </Callout>

    <Quiz
      question="What is a Claude Code routine, technically?"
      options={[
        "A third-party automation service you connect via webhook",
        "A .md file in .claude/commands/ with a schedule: cron field — Claude executes it on schedule or on demand",
        "A sub-agent that runs permanently in the background",
        "A GitHub Action that calls Claude via API",
      ]}
      correct={1}
      explain="Routines are command files. The schedule is a cron expression. No third-party service required — Claude Code reads a markdown file on a timer."
    />
  </>
);

const Lesson4 = () => (
  <>
    <div className="eyebrow">Lesson 04 · Tools</div>
    <h1 style={{ marginTop: 14, marginBottom: 18 }}>Skills — packaging your taste</h1>
    <p className="lede">
      A Skill is a folder of instructions Claude loads on demand. Think of it as a reusable brief: name, description, steps, examples, and any reference files. Once written, every future chat can invoke it.
    </p>

    <section>
      <h3>Anatomy of a Skill</h3>
      <p>A Skill is just a folder with a <code>SKILL.md</code> at the root. The frontmatter declares when Claude should reach for it; the body is plain prose — the way you'd brief a thoughtful junior.</p>

      <CodeBlock filename="skills/brand-critique/SKILL.md" lang="md">
{`---
name: Brand critique
description: Critique a piece of UI copy or a screen against our brand voice — direct, warm, never clever for clever's sake.
when_to_use: User pastes copy, asks for a "voice check", or wants brand-aligned rewrites.
---

# Brand critique

You are reviewing work against the **Acme** voice guide.

## Voice principles
- Plain words. Short sentences. No marketing tics ("seamlessly", "unleash").
- Lead with the verb. The reader is busy.
- Trust over hype: name the trade-off, don't hide it.

## Process
1. Restate what the copy is trying to do, in one line.
2. Flag every line that breaks a principle, with a fix.
3. Offer one bolder rewrite at the end.

## Reference
See \`examples/before-after.md\` for the bar.`}
      </CodeBlock>
    </section>

    <section>
      <h3>How Claude finds it</h3>
      <p>You don't have to "import" a skill. Claude reads the <code>description</code> and <code>when_to_use</code> in the frontmatter and decides — same way it decides which tool to call. Write those two lines like a search query for your future self.</p>

      <Callout kind="do" title="Skills you should write first">
        <p style={{ margin: 0 }}>
          <strong>Voice & critique</strong> · <strong>Component-naming conventions</strong> · <strong>Empty-state writing</strong> · <strong>Accessibility audit</strong> · <strong>Design-review checklist</strong>. Anything you find yourself re-explaining is a Skill in disguise.
        </p>
      </Callout>
    </section>

    <section>
      <h3>Skills in Claude Code vs Claude.ai</h3>
      <p>Skills follow the same open standard everywhere, but how you manage and invoke them differs by surface.</p>
      <div className="two-col">
        <div className="cheat-card">
          <h5>Claude Code</h5>
          <p>Skills are <strong>files on disk</strong>. Store them in <code>.claude/skills/</code> inside your repo (project-scoped) or <code>~/.claude/skills/</code> (personal, all repos). Invoke with <code>/skill-name</code> or let Claude auto-trigger. Edit the SKILL.md directly — changes take effect in the current session without restarting.</p>
        </div>
        <div className="cheat-card">
          <h5>Claude.ai</h5>
          <p>Skills are <strong>uploaded via UI</strong>. Go to Customize › Skills, toggle example skills on, or upload your own as a ZIP. Claude auto-triggers them — no slash command needed. On Enterprise, owners can provision skills org-wide so they appear for every user automatically.</p>
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16, fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            <th style={{ textAlign: "left", padding: "6px 12px 6px 0", color: "var(--text-2)" }}></th>
            <th style={{ textAlign: "left", padding: "6px 12px", color: "var(--text-2)" }}>Claude Code</th>
            <th style={{ textAlign: "left", padding: "6px 0", color: "var(--text-2)" }}>Claude.ai</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["Storage", "Files on disk", "ZIP upload via UI"],
            ["Invocation", "/skill-name or auto-trigger", "Auto-trigger only"],
            ["Customization", "Edit SKILL.md, live reload", "Upload new ZIP to update"],
            ["Extras", "Subagent execution, invocation control", "Partner skills (Figma, Notion, Atlassian)"],
            ["Scope", "Personal, project, or enterprise hierarchy", "Personal, team, or org-wide"],
          ].map(([label, code, web]) => (
            <tr key={label} style={{ borderBottom: "1px solid var(--border-subtle, var(--border))" }}>
              <td style={{ padding: "8px 12px 8px 0", color: "var(--text-2)", fontWeight: 500 }}>{label}</td>
              <td style={{ padding: "8px 12px", color: "var(--text-1)" }}>{code}</td>
              <td style={{ padding: "8px 0", color: "var(--text-1)" }}>{web}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>

    <section>
      <h3>How scope works in Claude Code</h3>
      <p>Where you put a skill file determines who can use it. Skills load from <code>.claude/skills/</code> in your starting directory and every parent up to the repo root, plus your personal <code>~/.claude/skills/</code>.</p>
      <CodeBlock filename="skill lookup order" lang="bash">
{`~/.claude/skills/         # personal — available in every repo
.claude/skills/           # project — this repo only
parent/.claude/skills/    # inherited — monorepo root`}
      </CodeBlock>
      <Callout kind="note" title="Higher scope wins on name collisions">
        <p style={{ margin: 0 }}>If two skills share the same name, the enterprise-level skill overrides the personal one, and personal overrides project. This lets a team standardize a <code>brand-critique</code> skill while still letting individuals override it locally.</p>
      </Callout>
    </section>

    <section>
      <h3>Try it — generate a skill from your own taste</h3>
      <TryIt
        label="Author a skill in 10 seconds"
        placeholder="In one sentence: what should this skill do?"
        defaultPrompt="Write a SKILL.md for: 'Empty state writer — turns blank states into helpful, on-brand moments. Voice is plain, warm, action-oriented.' Include frontmatter (name, description, when_to_use), 3 voice principles, a 4-step process, and one before/after example."
        hint="↳ paste the result into skills/empty-state/SKILL.md"
      />
    </section>

    <Quiz
      question="Why use Skills instead of pasting the same instructions into every chat?"
      options={[
        "Skills are encrypted",
        "Skills load only when needed, version with your repo, and let teammates reuse your taste",
        "Skills run faster",
        "Skills bypass the rate limit",
      ]}
      correct={1}
      explain="Skills are versioned, discoverable, and shareable — the closest thing to a design system for prompting."
    />
  </>
);

Object.assign(window, { Lesson1, Lesson2, Lesson3, Lesson4 });
