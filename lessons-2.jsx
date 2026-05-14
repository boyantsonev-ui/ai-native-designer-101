// Lessons 5-9 — Agents, MCP, Figma

const Lesson5 = () => (
  <>
    <div className="eyebrow">Foundations</div>
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

    <QuizTiered tiers={[
      {
        label: "Beginner",
        question: "What is the key thing that makes something an agent rather than a simple chatbot?",
        options: [
          "It uses a more powerful AI model",
          "It takes actions in the real world — editing files, calling APIs",
          "It can answer more questions at once",
          "It has a graphical user interface",
        ],
        correct: 1,
        explain: "An agent acts — it uses tools to read, write, call, and change things. A chatbot just produces text. The ability to take actions and observe results is what defines agent behaviour.",
      },
      {
        label: "Intermediate",
        question: "A workflow differs from an agent in that...",
        options: [
          "Workflows can't use tools",
          "Workflows have predefined paths; agents decide their own steps",
          "Agents are always smarter",
          "Workflows only run on Claude Desktop",
        ],
        correct: 1,
        explain: "Anthropic's distinction: workflows = code controls flow; agents = the model controls flow.",
      },
      {
        label: "Advanced",
        question: "Which factor is most decisive when choosing between a workflow and an agent for a task?",
        options: [
          "How long the task takes to complete",
          "Whether the exact steps are known in advance or depend on intermediate results",
          "How many tools are involved",
          "Whether a human needs to approve the result",
        ],
        correct: 1,
        explain: "If you can enumerate the exact steps before starting, a workflow is safer and cheaper. If steps depend on what you discover along the way — parsing an unknown file, acting on API results — an agent is appropriate.",
      },
    ]} />
  </>
);

const Lesson6 = () => (
  <>
    <div className="eyebrow">Foundations</div>
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

    <QuizTiered tiers={[
      {
        label: "Beginner",
        question: "In a multi-agent system, what is the orchestrator's job?",
        options: [
          "Run the most complex task itself",
          "Store data between sessions",
          "Coordinate sub-agents and combine their results",
          "Connect directly to external APIs",
        ],
        correct: 2,
        explain: "The orchestrator plans, delegates, and synthesizes. It doesn't do the domain work — it decides which sub-agent handles which part, then assembles the outputs into a final result.",
      },
      {
        label: "Intermediate",
        question: "When does spawning a sub-agent help most?",
        options: [
          "When the task is one short prompt",
          "When you want to confuse the model",
          "When a job has distinct sub-tasks needing different system prompts, tools, or models",
          "Never — one big agent is always better",
        ],
        correct: 2,
        explain: "Sub-agents are a separation of concerns. Different roles get different prompts, tools, and even different (cheaper) models.",
      },
      {
        label: "Advanced",
        question: "An orchestrator sends the same large context to three parallel sub-agents. Costs are high. What's the most targeted fix?",
        options: [
          "Switch to a cheaper model for the orchestrator",
          "Reduce the number of sub-agents to two",
          "Send each sub-agent only the slice of context relevant to its task",
          "Compress the context with a summarization pass first",
        ],
        correct: 2,
        explain: "Context bloat is the biggest cost driver in parallel architectures. Scoping each sub-agent's input to only what it needs reduces tokens proportionally to the number of agents.",
      },
    ]} />
  </>
);

const Lesson7 = () => (
  <>
    <div className="eyebrow">Foundations</div>
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

    <QuizTiered tiers={[
      {
        label: "Beginner",
        question: "Why do autonomous agents sometimes make mistakes a human wouldn't?",
        options: [
          "They are programmed to make random errors",
          "They are too fast to reason properly",
          "They cannot observe the full consequences of their actions in advance",
          "They forget previous steps in long tasks",
        ],
        correct: 2,
        explain: "Agents act step-by-step in a limited context. They can't 'see' the full system the way a human does — a change that looks locally correct can have downstream effects the agent didn't model.",
      },
      {
        label: "Intermediate",
        question: "The single biggest predictor of agent success is…",
        options: [
          "Model size",
          "Number of tools",
          "A precise, observable goal and a clear stop condition",
          "Running it overnight",
        ],
        correct: 2,
        explain: "Anthropic's repeated finding: simple loops with sharp goals beat elaborate scaffolds. The brief is the work.",
      },
      {
        label: "Advanced",
        question: "In a fully autonomous deploy pipeline, where should you place the mandatory human checkpoint?",
        options: [
          "Before any file write, because agents can't be trusted with code",
          "After synthesis, before any destructive action on production",
          "After every tool call, to maximise oversight",
          "Only on first run, then remove for efficiency",
        ],
        correct: 1,
        explain: "Checkpoints add latency and cost — place them where the blast radius of an error is highest. Before irreversible production actions (deploy, delete, migrate) is the minimum viable checkpoint set.",
      },
    ]} />
  </>
);

const Lesson8 = () => (
  <>
    <div className="eyebrow">Wiring</div>
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

    <QuizTiered tiers={[
      {
        label: "Beginner",
        question: "What problem does MCP solve for AI tools?",
        options: [
          "It makes models run faster on local hardware",
          "It gives every AI app a standard way to connect to external tools",
          "It stores user data more securely",
          "It translates between different AI models",
        ],
        correct: 1,
        explain: "Before MCP, every AI app needed custom integration code for every tool. MCP is a shared protocol — build a server once, and any MCP-compatible client can use it.",
      },
      {
        label: "Intermediate",
        question: "MCP is to AI tools what __ is to peripherals.",
        options: [
          "Wi-Fi",
          "USB-C",
          "Bluetooth Classic",
          "FireWire",
        ],
        correct: 1,
        explain: "One plug, many devices. Build once, work everywhere.",
      },
      {
        label: "Advanced",
        question: "Your design-system MCP server exposes a get_token tool and a list_tokens resource. When should you prefer a resource over a tool?",
        options: [
          "When the data changes frequently",
          "When you want the model to choose which data to fetch",
          "When the data is stable and can be read passively without side effects",
          "When the data requires authentication",
        ],
        correct: 2,
        explain: "Resources are read-only, side-effect-free data sources — the model can include them in context without triggering actions. Tools imply computation or side effects. Static tokens are a resource, not a tool.",
      },
    ]} />
  </>
);

const Lesson9 = () => (
  <>
    <div className="eyebrow">Wiring</div>
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

    <QuizTiered tiers={[
      {
        label: "Beginner",
        question: "What does connecting the Figma MCP to Claude Desktop let you do?",
        options: [
          "Export Figma files to PDF automatically",
          "Ask Claude questions about your designs directly in chat",
          "Edit Figma components from the terminal",
          "Sync Figma to GitHub automatically",
        ],
        correct: 1,
        explain: "The Figma MCP exposes your file's nodes, styles, and variables as tools Claude can call. Instead of copying specs manually, you ask 'What tokens does this component use?' and Claude reads the answer directly.",
      },
      {
        label: "Intermediate",
        question: "What does the Figma Console MCP add on top of the Figma MCP?",
        options: [
          "It edits Figma files programmatically",
          "It generates icons",
          "It inspects the live, rendered product so Claude can compare design vs. built",
          "It exports to PNG faster",
        ],
        correct: 2,
        explain: "Console-side inspection closes the loop — design intent vs. shipped reality, in one chat.",
      },
      {
        label: "Advanced",
        question: "7 components are using hardcoded hex values instead of tokens. What's the most efficient single-prompt workflow?",
        options: [
          "Export all components to JSON, fix manually, re-import",
          "List each component in Claude, fix one at a time",
          "Audit via Figma MCP, then apply fixes via Console MCP in one agentic session",
          "Write a Figma plugin to find and replace hardcoded values",
        ],
        correct: 2,
        explain: "Combining read (Figma MCP) and write (Console MCP) in one agent session is the power pattern. Claude audits the entire file with one pass and applies all fixes in the same context — no export/import loop.",
      },
    ]} />
  </>
);

Object.assign(window, { Lesson5, Lesson6, Lesson7, Lesson8, Lesson9 });
