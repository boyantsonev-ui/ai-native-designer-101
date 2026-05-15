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
    <div className="eyebrow">Lesson 09 · Wiring</div>
    <h1 style={{ marginTop: 14, marginBottom: 18 }}>Figma MCP — two tools, different jobs</h1>
    <p className="lede">
      Two MCP servers connect AI agents to Figma, but they solve different problems at different stages of the design workflow. Knowing which to reach for — and when to combine them — is the skill.
    </p>

    <section>
      <h3>Two servers, two makers</h3>
      <div className="two-col">
        <div className="cheat-card">
          <div className="eyebrow">Official · by Figma Inc.</div>
          <h5>Figma MCP</h5>
          <p>
            Hosted remotely — no desktop app required. Built for design-to-code workflows. Reads files, frames, variables, and components. Supports write (in beta) on paid plans. Powers{" "}
            <a href="https://www.figma.com/developers/code-connect" target="_blank" rel="noopener">Code Connect</a> for linking components to production code.
          </p>
          <p style={{ marginTop: 8 }}>
            <strong>Works in:</strong> Cursor, VS Code, Windsurf, Claude Code, Codex
          </p>
          <p style={{ marginTop: 6 }}>
            <a href="https://www.figma.com/developers/mcp" target="_blank" rel="noopener">Docs →</a>
            {" · "}
            <a href="https://www.npmjs.com/package/@figma/mcp-server" target="_blank" rel="noopener">npm →</a>
          </p>
        </div>
        <div className="cheat-card">
          <div className="eyebrow">Console MCP · by Southleft</div>
          <h5>Figma Console MCP</h5>
          <p>
            Third-party server by <a href="https://southleft.com" target="_blank" rel="noopener">Southleft</a>. Runs via a paired Figma desktop plugin, giving agents full plugin API access. Covers the phases the official MCP doesn't: audit, accessibility, version history, and arbitrary execution via <code>figma_execute</code>.
          </p>
          <p style={{ marginTop: 8 }}>
            <strong>Works in:</strong> Claude.ai, any MCP client (requires Figma desktop)
          </p>
        </div>
      </div>
    </section>

    <section>
      <h3>What each one can do</h3>

      <div className="cheat-card" style={{ marginTop: 16 }}>

        <div className="cc-item">
          <div className="eyebrow">Design system audit</div>
          <h4>Console MCP only</h4>
          <p>
            Parity checks, token drift detection, component consistency linting. The official MCP can read tokens; it can't audit them. Use Console MCP to catch divergence before handoff.
          </p>
        </div>

        <div className="cc-item">
          <div className="eyebrow">Accessibility</div>
          <h4>Console MCP only</h4>
          <p>
            <a href="https://www.w3.org/TR/WCAG22/" target="_blank" rel="noopener">WCAG 2.2</a> linting via <a href="https://github.com/dequelabs/axe-core" target="_blank" rel="noopener">axe-core</a>. Run a full accessibility audit against your Figma frames in one prompt. Official MCP has no accessibility tooling.
          </p>
        </div>

        <div className="cc-item">
          <div className="eyebrow">Code generation</div>
          <h4>Official MCP only</h4>
          <p>
            IDE-native output in Cursor, VS Code, and Claude Code. Pair with <a href="https://www.figma.com/developers/code-connect" target="_blank" rel="noopener">Code Connect</a> to map Figma components to your actual production components — not generic HTML. Console MCP has no role here.
          </p>
        </div>

        <div className="cc-item">
          <div className="eyebrow">Version history</div>
          <h4>Console MCP only</h4>
          <p>
            Diff, blame-style history, and changelog generation across file versions. Useful for release notes, stakeholder reports, and tracking who changed what between reviews.
          </p>
        </div>

        <div className="cc-item">
          <div className="eyebrow">Write to canvas</div>
          <h4>Console MCP (reliable) · Official (beta)</h4>
          <p>
            Console MCP has full, stable node creation and manipulation. Official MCP write capabilities are in active beta — full seats on paid plans only. Expect gaps and breaking changes as the official API evolves.
          </p>
        </div>

        <div className="cc-item">
          <div className="eyebrow">Arbitrary plugin execution</div>
          <h4>Console MCP only</h4>
          <p>
            <code>figma_execute</code> exposes the full Figma plugin API to Claude. Anything you could write in a Figma plugin, Claude can now do in a chat. No equivalent in the official MCP.
          </p>
        </div>

      </div>
    </section>

    <section>
      <h3>When to use which</h3>

      <div className="cheat-card" style={{ marginTop: 16 }}>

        <div className="cc-item">
          <div className="eyebrow">Official MCP</div>
          <h4>Generate code from designs in your IDE</h4>
          <p>Built exactly for this. Pair with <a href="https://www.figma.com/developers/code-connect" target="_blank" rel="noopener">Code Connect</a> in Cursor or VS Code for production-accurate output that maps to your real component library — not generic divs.</p>
        </div>

        <div className="cc-item">
          <div className="eyebrow">Console MCP</div>
          <h4>Audit for token drift, inconsistency, or accessibility failures</h4>
          <p>Full audit suite: design parity checks, <a href="https://www.w3.org/TR/WCAG22/" target="_blank" rel="noopener">WCAG 2.2</a> linting, component consistency, version diff. This is Console's home ground.</p>
        </div>

        <div className="cc-item">
          <div className="eyebrow">Console MCP</div>
          <h4>Use Claude.ai to run agentic design workflows</h4>
          <p>The official MCP is restricted to whitelisted clients (Cursor, VS Code, Claude Code). Console MCP is open — it works in Claude.ai and any MCP-compatible client.</p>
        </div>

        <div className="cc-item">
          <div className="eyebrow">Console MCP</div>
          <h4>Automate changelogs or CI-style design quality checks</h4>
          <p>Version diff, blame history, and <code>figma_execute</code> for custom verification workflows are Console-exclusive. Build the design quality gate your team has been asking for.</p>
        </div>

        <div className="cc-item">
          <div className="eyebrow">Either — context-dependent</div>
          <h4>Create or update Figma components using your design system</h4>
          <p>Official MCP with skills is the safer bet for most teams. Console MCP if you need stable writes today or full plugin API access. Both can read design system context.</p>
        </div>

      </div>
    </section>

    <section>
      <h3>Where each tool lives in the workflow</h3>
      <div className="cheat-card" style={{ marginTop: 16 }}>
        <div className="cc-item">
          <div className="eyebrow">Design & Composition</div>
          <h4>Console MCP leads, Official is catching up</h4>
          <p>Console MCP has reliable write — full node creation and manipulation. Official write is in beta. For agentic canvas manipulation today, Console MCP is the practical choice.</p>
        </div>
        <div className="cc-item">
          <div className="eyebrow">Design System</div>
          <h4>Console MCP owns this phase</h4>
          <p>Audit, lint, token CRUD, accessibility checks, version history. Official handles the code-side linkage via Code Connect. Run both together for complete coverage.</p>
        </div>
        <div className="cc-item">
          <div className="eyebrow">Handoff</div>
          <h4>Official MCP was built for this</h4>
          <p>Design context → structured code specs, readable by IDEs. Console MCP is read-only at handoff. This is where the official MCP's IDE-native integration pays off.</p>
        </div>
        <div className="cc-item">
          <div className="eyebrow">Review & Post-Ship</div>
          <h4>Console MCP closes the loop</h4>
          <p>Compare what shipped vs. what was designed. Accessibility checks, design parity reports, changelog — all Console. Official MCP has no post-ship role.</p>
        </div>
      </div>
    </section>

    <section>
      <h3>What a combined session looks like</h3>
      <ChatMock
        title="Claude · figma + figma-console"
        messages={[
          { role: "user", text: "Compare the Settings page on production vs. the latest Figma frame. Where did we drift? Also run an accessibility check on the design." },
          { role: "ai",
            toolCall: { name: "figma.get_node('Settings · v8')", body: "→ pulled tokens, layout, copy, components" },
            text: "Got the design. Running Console audit now." },
          { role: "ai",
            toolCall: { name: "figma_console.audit_accessibility('Settings · v8')", body: "→ 3 WCAG 2.2 violations: missing focus ring (AA), contrast ratio 3.1:1 on helper text (AA fail), icon without label" },
            text: "Three accessibility issues found. Also checking against production for drift." },
          { role: "ai",
            toolCall: { name: "figma_console.diff_versions('v7', 'v8')", body: "→ spacing.section: 24px → 16px, color.danger: --rose-700 → --red-600, mobile avatar: visible → hidden" },
            text: "Three drift points between design v8 and production: (1) Section spacing is 24px in design, 16px in prod. (2) Danger zone header uses --rose-700 in Figma, --red-600 in code. (3) Avatar hidden at 480px in prod — design keeps it visible. Want a Linear ticket per issue?" },
        ]}
      />
    </section>

    <section>
      <h3>Setup</h3>
      <CodeTabs files={[
        {
          name: "Official Figma MCP",
          lang: "json",
          code: `{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "@figma/mcp-server"],
      "env": { "FIGMA_TOKEN": "figd_..." }
    }
  }
}`,
        },
        {
          name: "Console MCP (Claude Desktop)",
          lang: "json",
          code: `{
  "mcpServers": {
    "figma-console": {
      "command": "npx",
      "args": ["-y", "@southleft/figma-mcp"],
      "env": { "FIGMA_TOKEN": "figd_..." }
    }
  }
}`,
        },
        {
          name: "Both together",
          lang: "json",
          code: `{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "@figma/mcp-server"],
      "env": { "FIGMA_TOKEN": "figd_..." }
    },
    "figma-console": {
      "command": "npx",
      "args": ["-y", "@southleft/figma-mcp"],
      "env": { "FIGMA_TOKEN": "figd_..." }
    }
  }
}`,
        },
      ]} />
    </section>

    <Callout kind="warn" title="Official write is in active beta">
      As of mid-2026, the Official Figma MCP's write capabilities require full seats on paid plans and are still evolving rapidly. Expect API changes. For stable programmatic writes today, Console MCP is the more reliable option. Check the <a href="https://www.figma.com/developers/mcp" target="_blank" rel="noopener">official changelog</a> before building write-heavy workflows on the official server.
    </Callout>

    <Callout kind="do" title="Designer leverage">
      Once Figma is on MCP, the source of truth becomes <em>the file</em> again — not a Storybook fork or screenshots in a Linear ticket. Drift becomes detectable. Accessibility becomes auditable. Reviews become quantitative.
    </Callout>

    <QuizTiered tiers={[
      {
        label: "Beginner",
        question: "What is the main difference between the Official Figma MCP and the Console MCP?",
        options: [
          "The official MCP is free; the Console MCP requires a paid plan",
          "The official MCP is made by Figma Inc. and optimised for IDE code generation; the Console MCP is by Southleft and covers audit, write, and accessibility",
          "The Console MCP only reads Figma files; the official MCP can edit them",
          "They are identical — the Console MCP is just an older version",
        ],
        correct: 1,
        explain: "Two different makers, two different jobs. Official MCP (Figma Inc.) is built for design-to-code handoff in IDEs. Console MCP (Southleft) is built for audit, manipulation, accessibility, and anything requiring the full Figma plugin API.",
      },
      {
        label: "Intermediate",
        question: "A designer wants to run a WCAG 2.2 accessibility audit on a Figma file using Claude. Which server makes this possible?",
        options: [
          "The Official Figma MCP — it includes an accessibility scanner",
          "Neither — accessibility auditing requires a dedicated plugin, not an MCP",
          "The Console MCP — it runs WCAG 2.2 checks via axe-core",
          "Both servers support accessibility auditing equally",
        ],
        correct: 2,
        explain: "WCAG 2.2 auditing via axe-core is a Console MCP exclusive. The Official Figma MCP has no accessibility tooling. Console MCP's full plugin API access is what makes this possible.",
      },
      {
        label: "Advanced",
        question: "Your team wants Claude to: (1) generate React components from Figma using your Code Connect mappings, and (2) flag any frames failing WCAG AA. What's the correct setup?",
        options: [
          "Official MCP only — Code Connect handles both needs",
          "Console MCP only — it has full capabilities",
          "Official MCP for code generation with Code Connect, Console MCP for the WCAG audit — run both servers simultaneously",
          "Neither — this workflow requires a custom Figma plugin, not MCP",
        ],
        correct: 2,
        explain: "Code Connect and IDE-native code generation are Official MCP's speciality. WCAG auditing is Console MCP's speciality. Both can run simultaneously in Claude Code — the agent decides which tool to call for each sub-task.",
      },
    ]} />
  </>
);

Object.assign(window, { Lesson5, Lesson6, Lesson7, Lesson8, Lesson9 });
