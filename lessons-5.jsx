// Lesson 14 — The course that teaches itself

function Lesson14() {
  return (
    <div>

      <HeroCard
        eyebrow="Meta · Lesson 14"
        title="The course that teaches itself"
        lede="Every rating you submitted, every question you asked — this system processed it. Here's the architecture running underneath."
        meta={["4 min read", "Orchestrator pattern", "Live example"]}
      />

      <section>
        <h2>This isn't a demo</h2>
        <p>
          Most courses talk about AI-native architectures. This one runs on one. The feedback panel at the bottom of each lesson doesn't just collect stars — it feeds a live learning loop that proposes content improvements and can open a GitHub PR to apply them.
        </p>
        <p>
          Everything in this architecture is a pattern you've already seen in the course. The diagram below cross-references each node back to the lesson that introduced it.
        </p>
      </section>

      <section>
        <h2>The orchestrator diagram</h2>
        <AgentDiagram kind="course-orchestrator" />
      </section>

      <section>
        <h2>How each node maps to a pattern</h2>

        <div className="cheat-card" style={{ marginTop: 16 }}>

          <div className="cc-item">
            <div className="eyebrow">Augmented LLM · Lesson 5</div>
            <h4>Supabase + /api/synthesize</h4>
            <p>
              The synthesis function is an LLM (Claude API) augmented with external memory — Supabase stores the feedback it reads and the proposals it writes. That's the Augmented LLM pattern: model + retrieval + memory + tools.
            </p>
          </div>

          <div className="cc-item">
            <div className="eyebrow">Evaluator-Optimizer · Lesson 6</div>
            <h4>Feedback → proposals → revisions</h4>
            <p>
              Each synthesis run evaluates the course against learner feedback and generates graded improvement proposals. Approved proposals close the loop — the course is the generator, synthesis is the evaluator, the HITL review is the optimizer step.
            </p>
          </div>

          <div className="cc-item">
            <div className="eyebrow">Human-in-the-Loop · Lesson 7</div>
            <h4>The HITL proposals tab</h4>
            <p>
              Trivial proposals can be auto-applied via PR; minor and major ones require human review. This is the HITL checkpoint pattern: the agent proposes, a human decides, the system acts. Nothing major ships without approval.
            </p>
          </div>

          <div className="cc-item">
            <div className="eyebrow">Orchestrator + sub-agent · Lesson 6</div>
            <h4>/api/apply → GitHub → Vercel</h4>
            <p>
              The admin dashboard is the orchestrator: it receives an approved proposal and delegates to the <code>/api/apply</code> sub-agent, which fetches the file, makes a targeted edit via Claude, opens a branch, and creates a PR. The orchestrator never touches the file directly.
            </p>
          </div>

        </div>
      </section>

      <section>
        <h2>The three infrastructure pieces</h2>
        <CodeTabs files={[
          {
            name: "vercel.json",
            lang: "json",
            code: `{
  "crons": [
    {
      "path": "/api/synthesize",
      "schedule": "0 9 * * MON"
    }
  ]
}`,
          },
          {
            name: "api/synthesize.js (shape)",
            lang: "js",
            code: `// 1. Guard — reject if already running
// 2. Fetch feedback WHERE synthesized = false
// 3. If count < threshold, skip
// 4. Call Claude API with the synthesis prompt
// 5. Bulk-insert proposals to hitl_proposals
// 6. Mark feedback synthesized = true
// 7. Update syntheses row to status = 'complete'`,
          },
          {
            name: "Supabase schema (key tables)",
            lang: "sql",
            code: `-- Learner feedback (written directly from browser)
feedback (id, lesson_id, type, rating, content,
          sentiment, synthesized, session_id)

-- One row per synthesis run
syntheses (id, feedback_count, trigger, status, error)

-- Improvement proposals from each synthesis
hitl_proposals (id, synthesis_id, lesson_id, severity,
                type, title, problem, proposal, reasoning,
                feedback_count, status, admin_note, pr_url)`,
          },
        ]} />
      </section>

      <section>
        <h2>The upgrade path — Hermes</h2>

        <Callout kind="note" title="When to consider Hermes by Nous Research">
          <p>
            The current loop is a single-shot synthesis: one LLM call, structured output, done. That's the right starting point. When your loop becomes multi-step — synthesis → draft revision → review → commit — you need an agent framework that handles persistent memory, skill reuse, and multi-backend orchestration.
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>Hermes</strong> (MIT license, self-hosted) is built for exactly that. It adds: cross-session memory with FTS5 search, autonomous skill creation from successful runs, and 20+ messaging platform integrations so the agent is reachable without direct server access. Wire it in as the synthesis orchestrator when your loop outgrows a single function call.
          </p>
        </Callout>
      </section>

      <section>
        <h2>Setup checklist</h2>
        <p>
          The architecture is deployed when you complete these steps. Until then the system falls back gracefully to localStorage and local synthesis via <code>window.claude.complete</code>.
        </p>
        <div className="cheat-card" style={{ marginTop: 16 }}>
          <div className="cc-item">
            <div className="eyebrow">Step 1</div>
            <h4>Create a Supabase project</h4>
            <p>Run the three <code>CREATE TABLE</code> statements and RLS policies from the plan. Copy the project URL and anon key into <code>app.jsx</code> (<code>SUPABASE_URL</code> / <code>SUPABASE_ANON_KEY</code>).</p>
          </div>
          <div className="cc-item">
            <div className="eyebrow">Step 2</div>
            <h4>Add env vars to Vercel</h4>
            <p>In Vercel project settings → Environment Variables, add: <code>ANTHROPIC_API_KEY</code>, <code>SUPABASE_URL</code>, <code>SUPABASE_SERVICE_ROLE_KEY</code>, <code>GITHUB_TOKEN</code>, <code>GITHUB_OWNER</code>, <code>GITHUB_REPO</code>.</p>
          </div>
          <div className="cc-item">
            <div className="eyebrow">Step 3</div>
            <h4>Deploy</h4>
            <p>Push to GitHub. Vercel auto-detects <code>vercel.json</code> and the <code>/api</code> folder. The cron and serverless functions are live on first deploy. Submit a test rating to verify the Supabase write.</p>
          </div>
          <div className="cc-item">
            <div className="eyebrow">Step 4</div>
            <h4>Open the admin dashboard</h4>
            <p>Click the "AI-Native Designer 101" brand logo five times → enter your admin password → Automations tab shows pipeline status. Run a manual synthesis to generate your first HITL proposals.</p>
          </div>
        </div>
      </section>

      <Quiz
        question="Which pattern best describes the /api/synthesize function in this architecture?"
        options={[
          "Prompt chaining — it passes output from one step to the next in sequence",
          "Routing — it classifies feedback and sends it to different handlers",
          "Augmented LLM — it uses external memory (Supabase) and produces structured output",
          "Parallelization — it runs multiple LLM calls simultaneously",
        ]}
        correct={2}
        explain="Correct. The synthesis function is an LLM augmented with retrieval (reads feedback from Supabase) and memory (writes proposals back). That's the Augmented LLM building block — the same pattern as Lesson 5's diagram."
      />

    </div>
  );
}
