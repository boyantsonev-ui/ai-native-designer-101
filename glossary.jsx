// Glossary content + Cheat Sheet content

const GLOSSARY = [
  { term: "Agent", tag: "concept", def: "An LLM that decides its own next step in a loop using tools, until a goal is met or a stop condition fires." },
  { term: "Augmented LLM", tag: "concept", def: "The atomic building block: an LLM with retrieval (lookup), memory (state), and tools (action)." },
  { term: "CLAUDE.md", tag: "file", def: "A markdown file at the root of a repo that Claude Code reads automatically. The project-level brief: tech stack, file structure, conventions, and what not to touch." },
  { term: "Claude Code", tag: "tool", def: "Anthropic's terminal-native coding agent. Reads, writes, and runs commands inside a repo with your supervision." },
  { term: "Claude Desktop", tag: "tool", def: "Anthropic's chat app for macOS/Windows/Linux. Hosts MCP servers and Projects." },
  { term: "Connector", tag: "tool", def: "A user-facing label for an MCP server in Claude Desktop. Same thing, friendlier name." },
  { term: "Cowork", tag: "mode", def: "The collaborative middle mode in the Claude Code desktop app (between Chat and Code). Claude can use tools and take actions while you steer each step — pair-programming feel, not full autonomy." },
  { term: "Custom Command", tag: "concept", def: "A .md file in .claude/commands/ that Claude Code can execute on demand via 'claude run <name>'. The building block of Routines." },
  { term: "Evaluator–Optimizer", tag: "pattern", def: "Workflow where one model generates and a second model critiques; the generator revises based on feedback." },
  { term: "Figma MCP", tag: "server", def: "MCP server that exposes Figma files, frames, components, and variables as resources Claude can query." },
  { term: "Figma Console MCP", tag: "server", def: "MCP server that opens a live URL in a headless browser so Claude can inspect rendered DOM, styles, and console output." },
  { term: "Frontmatter", tag: "syntax", def: "The YAML block at the top of a markdown file (between `---` lines). Used by Skills and MDX to declare metadata." },
  { term: "Hotjar", tag: "server", def: "Recordings + surveys analytics. The 'why they did it' layer in your measurement stack." },
  { term: "MCP", tag: "protocol", def: "Model Context Protocol — open standard for connecting an LLM host to tools, resources, and prompts." },
  { term: "MDX", tag: "format", def: "Markdown with embedded React components. Common for docs sites and content-driven pages." },
  { term: "Microsoft Clarity", tag: "server", def: "Free heatmaps + session recordings. The 'where it hurt' layer in your measurement stack." },
  { term: "Orchestrator", tag: "pattern", def: "A 'lead' agent that plans and delegates to sub-agents, then synthesizes their results." },
  { term: "Parallelization", tag: "pattern", def: "Workflow that runs the same input through multiple LLM calls (vote) or splits work into chunks (sectioning)." },
  { term: "PostHog", tag: "server", def: "Open product analytics — funnels, A/B tests, feature flags. The 'what happened' layer." },
  { term: "Project (Claude)", tag: "tool", def: "A persistent container for chats with shared system prompt, files, and MCP servers." },
  { term: "Prompt Chaining", tag: "pattern", def: "Workflow where one LLM call's output feeds the next, in a fixed sequence." },
  { term: "Routine", tag: "concept", def: "A Custom Command with a schedule: cron field. Claude Code executes it automatically on the given schedule — no third-party service required." },
  { term: "Routing", tag: "pattern", def: "Workflow where a router LLM classifies the input and dispatches it to a specialized handler." },
  { term: "Schema (JSON Schema)", tag: "format", def: "A declarative description of valid data shape. Used by agents, CI, and editors to validate content." },
  { term: "Skill", tag: "concept", def: "A folder (with SKILL.md at root) containing instructions Claude loads on demand based on the description." },
  { term: "Sub-agent", tag: "concept", def: "A scoped agent invoked by an orchestrator. Has its own system prompt, tools, and (often) cheaper model." },
  { term: "Tool (in MCP)", tag: "concept", def: "A function the model can call — `github.create_pr()`, `posthog.query()`. The verbs of MCP." },
  { term: "Vercel", tag: "tool", def: "Hosting platform that turns every Git branch into a live preview URL — the new design-review surface." },
  { term: "Workflow", tag: "concept", def: "An LLM system where code controls the path. Predictable, traceable, cheap. Most production tasks should start here." },
  { term: "YAML", tag: "format", def: "Human-friendly config format. Used by CI, agent configs, design tokens, deploy settings." },
];

function GlossaryModal({ onClose }) {
  const [q, setQ] = useState("");
  const filtered = GLOSSARY.filter(g =>
    g.term.toLowerCase().includes(q.toLowerCase()) ||
    g.def.toLowerCase().includes(q.toLowerCase()) ||
    g.tag.toLowerCase().includes(q.toLowerCase())
  );
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="eyebrow">Reference</div>
            <h3 style={{ marginTop: 6 }}>Glossary</h3>
          </div>
          <button className="btn btn-ghost" onClick={onClose}>Close ✕</button>
        </div>
        <div className="modal-body">
          <input
            className="glossary-search"
            placeholder="Search 26 terms…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
          />
          {filtered.map((g, i) => (
            <div key={i} className="gloss-item">
              <div className="gloss-term">
                {g.term}
                <span className="mono">{g.tag}</span>
              </div>
              <div className="gloss-def">{g.def}</div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p style={{ color: "var(--ink-3)", textAlign: "center", padding: 24 }}>No matches.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function CheatSheetModal({ onClose }) {
  const print = () => window.print();
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 900 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="eyebrow">Take it with you</div>
            <h3 style={{ marginTop: 6 }}>Cheat sheet · AI-Native Designer 101</h3>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={print}>Print / save PDF</button>
            <button className="btn btn-ghost" onClick={onClose}>Close ✕</button>
          </div>
        </div>
        <div className="modal-body" id="cheatsheet">
          <div className="cheat-preview" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            <div className="cheat-card">
              <h5>Surfaces</h5>
              <p><strong>Desktop</strong> — chat, thinking, MCP host.<br/><strong>Code</strong> — terminal agent loop on a repo.</p>
            </div>
            <div className="cheat-card">
              <h5>Skills</h5>
              <p>Folder + SKILL.md with frontmatter (name, description, when_to_use). Claude loads on demand.</p>
            </div>
            <div className="cheat-card">
              <h5>Workflows (you control flow)</h5>
              <p>Prompt chain · Routing · Parallelization · Evaluator–Optimizer.</p>
            </div>
            <div className="cheat-card">
              <h5>Agents (model controls flow)</h5>
              <p>Loop: think → act → observe. Need: clear goal, sandboxed tools, observable steps, stop condition.</p>
            </div>
            <div className="cheat-card">
              <h5>Sub-agents</h5>
              <p>Orchestrator + workers. Each has own prompt, tools, model. Define in <code>.claude/agents/*.md</code>.</p>
            </div>
            <div className="cheat-card">
              <h5>MCP servers</h5>
              <p>Tools · Resources · Prompts · Sampling. Configure in <code>claude_desktop_config.json</code>.</p>
            </div>
            <div className="cheat-card">
              <h5>Figma stack</h5>
              <p><strong>figma-mcp</strong> — read files, components, variables.<br/><strong>figma-console-mcp</strong> — inspect live page.</p>
            </div>
            <div className="cheat-card">
              <h5>File types</h5>
              <p><code>.md</code> briefs · <code>.mdx</code> pages · <code>.yaml</code> config · <code>schema.json</code> contracts.</p>
            </div>
            <div className="cheat-card">
              <h5>Ship</h5>
              <p>Claude Code → git branch → GitHub PR → Vercel preview URL. One chat, one URL.</p>
            </div>
            <div className="cheat-card">
              <h5>Measure</h5>
              <p><strong>PostHog</strong> what happened · <strong>Clarity</strong> where it hurt · <strong>Hotjar</strong> why they did it.</p>
            </div>
            <div className="cheat-card" style={{ gridColumn: "1 / -1", borderColor: "var(--clay)" }}>
              <h5 style={{ color: "var(--clay-deep)" }}>The brief is the work</h5>
              <p>A vague prompt ships a vague product — just faster. Write the brief: the outcome you want, the taste it should hit, and what "done" looks like. Models change every quarter. The brief is the skill that lasts.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { GlossaryModal, CheatSheetModal });
