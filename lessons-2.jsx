// Lessons 5-9 — Agents, MCP, Figma

const Lesson5 = () => (
  <>
    <div className="eyebrow">Lesson 05 · Foundations</div>
    <h1 style={{ marginTop: 14, marginBottom: 18 }}>Agents — what Anthropic actually means</h1>
    <p className="lede">
      "Agent" is the most overloaded word in tech. Anthropic's research <em>Building effective agents</em> draws a clean line: <strong>workflows</strong> are LLMs orchestrated by code. <strong>Agents</strong> are LLMs that orchestrate themselves. Both are useful — knowing which you need is the skill.
    </p>

    <section>
      <h3>The atom: an augmented LLM</h3>
      <p>Every pattern below is built from one building block — an LLM with three augmentations: retrieval (it can look things up), memory (it remembers across turns), and tools (it can act).</p>
      <AgentDiagram kind="augmented-llm" />
    </section>

    <section>
      <h3>Workflows: predictable, traceable</h3>
      <p>You wrote the path. The LLM fills the steps. Use these when the task is well-defined and you need consistency.</p>
      <AgentDiagram kind="prompt-chain" />
      <p style={{ marginTop: 16 }}><strong>Prompt chaining</strong> — break a task into steps. Each step's output feeds the next. Best for: long content (extract → outline → draft → polish), translation pipelines, structured generation.</p>

      <AgentDiagram kind="router" />
      <p style={{ marginTop: 16 }}><strong>Routing</strong> — classify the input, send it down the right branch. Best for: support triage, model-tier selection (cheap → smart), multi-product chat.</p>

      <AgentDiagram kind="parallel" />
      <p style={{ marginTop: 16 }}><strong>Parallelization</strong> — run the same input through several lenses (vote) or split into independent chunks (sectioning). Best for: safety classifiers, multi-perspective review, long-doc summarization.</p>
    </section>

    <Callout kind="note" title="Workflow-first heuristic">
      Reach for workflows whenever the task is repeatable and the cost of a wrong path is high. They're cheaper, faster, and easier to debug than autonomous agents.
    </Callout>

    <Quiz
      question="A workflow differs from an agent in that..."
      options={[
        "Workflows can't use tools",
        "Workflows have predefined paths; agents decide their own steps",
        "Agents are always smarter",
        "Workflows only run on Claude Desktop",
      ]}
      correct={1}
      explain="Anthropic's distinction: workflows = code controls flow; agents = the model controls flow."
    />
  </>
);

const Lesson6 = () => (
  <>
    <div className="eyebrow">Lesson 06 · Foundations</div>
    <h1 style={{ marginTop: 14, marginBottom: 18 }}>Sub-agents & the orchestrator pattern</h1>
    <p className="lede">
      Once a single Claude is doing too many jobs at once, split it. The orchestrator pattern keeps a "lead" model planning and delegating, while focused sub-agents do narrow, well-scoped work.
    </p>

    <section>
      <h3>How it composes</h3>
      <AgentDiagram kind="orchestrator" />
      <p style={{ marginTop: 16 }}>
        The lead agent reads the goal, decomposes it, and spawns sub-agents — each with its own system prompt, tools, and budget. Results flow back up; the lead synthesizes. Think: a creative director with a researcher, a writer, and a reviewer.
      </p>
    </section>

    <section>
      <h3>The evaluator–optimizer loop</h3>
      <AgentDiagram kind="evaluator" />
      <p style={{ marginTop: 16 }}>
        A second pattern worth knowing: a generator drafts, an evaluator critiques, the generator revises. This is how you get quality without writing rules — Claude grading Claude, with you setting the rubric.
      </p>
    </section>

    <Callout kind="do" title="Designer translation">
      <p style={{ margin: 0 }}>An <strong>orchestrator</strong> is your art director. <strong>Sub-agents</strong> are specialist freelancers. <strong>Evaluator/optimizer</strong> is your design crit. You already run this team — agents just let you scale it.</p>
    </Callout>

    <section>
      <h3>Sub-agent declaration in Claude Code</h3>
      <CodeBlock filename=".claude/agents/researcher.md" lang="md">
{`---
name: researcher
description: Reads docs, summarizes findings into bullet notes, never writes code.
tools: read_file, web_search, web_fetch
model: claude-haiku-4-5
---

# Researcher

You are a focused research sub-agent. Your only job is to gather
and summarize relevant information for the lead agent.

## Output format
- 5-10 bullet notes
- Each bullet ends with [source: filename or url]
- No prose. No conclusions. Notes only.`}
      </CodeBlock>
    </section>

    <Quiz
      question="When does spawning a sub-agent help most?"
      options={[
        "When the task is one short prompt",
        "When you want to confuse the model",
        "When a job has distinct sub-tasks needing different system prompts, tools, or models",
        "Never — one big agent is always better",
      ]}
      correct={2}
      explain="Sub-agents are a separation of concerns. Different roles get different prompts, tools, and even different (cheaper) models."
    />
  </>
);

const Lesson7 = () => (
  <>
    <div className="eyebrow">Lesson 07 · Foundations</div>
    <h1 style={{ marginTop: 14, marginBottom: 18 }}>The autonomous agent — and when to use one</h1>
    <p className="lede">
      An agent, in the strict sense, is an LLM that decides its own next step in a loop until the goal is met. They're powerful and expensive — like a contractor with a key to your office.
    </p>

    <section>
      <AgentDiagram kind="agent-loop" />
    </section>

    <section>
      <h3>Use one when…</h3>
      <ul>
        <li>The path can't be predicted in advance (debugging, exploration, research).</li>
        <li>The cost of a wrong step is recoverable (sandboxed, reversible, observable).</li>
        <li>You can describe success precisely — agents need a clear stop condition.</li>
      </ul>
      <h3>Avoid one when…</h3>
      <ul>
        <li>A simple workflow would do (most production tasks).</li>
        <li>Mistakes touch real users, money, or irreversible state.</li>
        <li>You can't observe what it's doing — opacity is danger at scale.</li>
      </ul>
    </section>

    <Callout kind="warn" title="Agents amplify clarity — and ambiguity">
      <p style={{ margin: 0 }}>Vague goals + autonomous loops = expensive nonsense. The investment is in the brief, not the model.</p>
    </Callout>

    <section>
      <h3>The four agent shapes you'll meet</h3>
      <div className="two-col">
        <div className="cheat-card"><h5>Coding agents</h5><p>Claude Code, Cursor agents. Loop on a repo with file + shell tools.</p></div>
        <div className="cheat-card"><h5>Research agents</h5><p>Loop on the web with browse + fetch. Output: notes, not actions.</p></div>
        <div className="cheat-card"><h5>Computer-use agents</h5><p>Loop on a desktop with mouse, keyboard, screenshots. Still early.</p></div>
        <div className="cheat-card"><h5>Domain agents</h5><p>Narrow loops on one domain — design QA, analytics digest, support triage.</p></div>
      </div>
    </section>

    <Quiz
      question="The single biggest predictor of agent success is…"
      options={[
        "Model size",
        "Number of tools",
        "A precise, observable goal and a clear stop condition",
        "Running it overnight",
      ]}
      correct={2}
      explain="Anthropic's repeated finding: simple loops with sharp goals beat elaborate scaffolds. The brief is the work."
    />
  </>
);

const Lesson8 = () => (
  <>
    <div className="eyebrow">Lesson 08 · Wiring</div>
    <h1 style={{ marginTop: 14, marginBottom: 18 }}>MCP — the USB-C of AI tools</h1>
    <p className="lede">
      The Model Context Protocol is an open standard for connecting an LLM to anything: a database, a SaaS API, a local file. Once a service speaks MCP, every MCP-aware host (Claude Desktop, Claude Code, Cursor, Zed…) can use it.
    </p>

    <section>
      <AgentDiagram kind="mcp-bus" />
    </section>

    <section>
      <h3>What an MCP server gives Claude</h3>
      <div className="two-col">
        <div className="cheat-card"><h5>Tools</h5><p>Functions Claude can call — <code>github.create_pr()</code>, <code>posthog.query()</code>.</p></div>
        <div className="cheat-card"><h5>Resources</h5><p>Read-only context — files, records, design specs.</p></div>
        <div className="cheat-card"><h5>Prompts</h5><p>Pre-written templates the host can offer as quick actions.</p></div>
        <div className="cheat-card"><h5>Sampling</h5><p>The server can ask Claude back — true two-way conversation.</p></div>
      </div>
    </section>

    <section>
      <h3>Adding a server in 30 seconds</h3>
      <p>In Claude Desktop, MCP servers live in one config file. Edit it once, restart, and every chat can reach them.</p>
      <CodeBlock filename="~/.config/claude/claude_desktop_config.json" lang="json">
{`{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "@figma/mcp-server"],
      "env": { "FIGMA_TOKEN": "figd_..." }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "ghp_..." }
    },
    "posthog": {
      "command": "uvx",
      "args": ["posthog-mcp"],
      "env": { "POSTHOG_API_KEY": "phx_..." }
    }
  }
}`}
      </CodeBlock>
    </section>

    <Callout kind="note" title="Why this matters for designers">
      <p style={{ margin: 0 }}>You don't need to build MCP servers. You need to <em>compose</em> them — which ones, in which combinations, with what permissions. That orchestration is design work.</p>
    </Callout>

    <Quiz
      question="MCP is to AI tools what __ is to peripherals."
      options={[
        "Wi-Fi",
        "USB-C",
        "Bluetooth Classic",
        "FireWire",
      ]}
      correct={1}
      explain="One plug, many devices. Build once, work everywhere."
    />
  </>
);

const Lesson9 = () => (
  <>
    <div className="eyebrow">Lesson 09 · Wiring</div>
    <h1 style={{ marginTop: 14, marginBottom: 18 }}>Figma MCP — designs as conversation</h1>
    <p className="lede">
      With the Figma MCP, your design file becomes a queryable resource. Claude can read frames, components, variables, comments — and turn them into code, copy, audits, or tickets. The Figma Console MCP adds the missing other half: live inspection of running pages so Claude can compare design vs. reality.
    </p>

    <section>
      <h3>Two complementary servers</h3>
      <div className="two-col">
        <div className="cheat-card">
          <h5>Figma MCP</h5>
          <p><span className="mono">@figma/mcp-server</span> — reads files, frames, variables, components from your Figma workspace.</p>
        </div>
        <div className="cheat-card">
          <h5>Figma Console MCP</h5>
          <p>Inspects the live deployed page in a headless browser — DOM, computed styles, console logs — so Claude can diff design vs. built.</p>
        </div>
      </div>
    </section>

    <section>
      <h3>What "designs as conversation" looks like</h3>
      <ChatMock
        title="Claude · figma + figma-console"
        messages={[
          { role: "user", text: "Compare the Settings page on production vs. the latest Figma frame. Where did we drift?" },
          { role: "ai",
            toolCall: { name: "figma.get_node('Settings · v8')", body: "→ pulled tokens, layout, copy" },
            text: "Got the design. Now checking production." },
          { role: "ai",
            toolCall: { name: "figma_console.inspect('app.acme.com/settings')", body: "→ rendered DOM, 12 components" },
            text: "Three drift points: (1) Section spacing is 24px in design, 16px in prod. (2) The 'Danger zone' header uses --rose-700 in Figma but --red-600 in code. (3) The mobile breakpoint hides the avatar at 480px in prod; design keeps it. Want me to open a Linear ticket per item?" },
        ]}
      />
    </section>

    <section>
      <h3>Schema — what a Figma resource looks like</h3>
      <CodeBlock filename="figma-resource.json" lang="json">
{`{
  "node_id": "1024:88",
  "name": "Settings · v8 / Profile",
  "type": "FRAME",
  "tokens": {
    "spacing.section": "24px",
    "color.danger.heading": "var(--rose-700)"
  },
  "components": ["Avatar", "InputRow", "DangerZone"],
  "comments": [
    { "author": "Lia", "text": "Avatar should stay on mobile" }
  ]
}`}
      </CodeBlock>
    </section>

    <Callout kind="do" title="Designer leverage">
      <p style={{ margin: 0 }}>Once Figma is on MCP, the source of truth becomes <em>the file</em> again — not a Storybook fork or screenshots in a Linear ticket. Drift becomes detectable. Reviews become quantitative.</p>
    </Callout>

    <Quiz
      question="What does the Figma Console MCP add on top of the Figma MCP?"
      options={[
        "It edits Figma files programmatically",
        "It generates icons",
        "It inspects the live, rendered product so Claude can compare design vs. built",
        "It exports to PNG faster",
      ]}
      correct={2}
      explain="Console-side inspection closes the loop — design intent vs. shipped reality, in one chat."
    />
  </>
);

Object.assign(window, { Lesson5, Lesson6, Lesson7, Lesson8, Lesson9 });
