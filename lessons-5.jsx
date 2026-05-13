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
          The architecture is live when you complete these six steps. Until then the system falls back gracefully to localStorage and local synthesis via <code>window.claude.complete</code>.
        </p>

        {/* ── Step 1: Supabase ── */}
        <div className="cheat-card" style={{ marginTop: 24 }}>
          <div className="cc-item" style={{ gridColumn: "1 / -1" }}>
            <div className="eyebrow">Step 1</div>
            <h4>Create a Supabase project &amp; run the schema</h4>
            <p>Go to <strong>supabase.com → New project</strong>. Once it's provisioned, open the <strong>SQL Editor</strong> and run these three tables in order:</p>
          </div>
        </div>

        <CodeTabs files={[
          {
            name: "feedback",
            lang: "sql",
            code: `CREATE TABLE feedback (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id    INT,
  lesson_title TEXT,
  type         TEXT,        -- 'rating' or 'chat'
  rating       INT,         -- 1–5 (null for chat entries)
  content      TEXT,
  sentiment    TEXT,        -- 'positive' | 'neutral' | 'negative'
  synthesized  BOOLEAN DEFAULT false,
  session_id   TEXT,
  created_at   TIMESTAMP DEFAULT now()
);

-- Allow anonymous browser inserts (RLS must be enabled)
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon insert" ON feedback
  FOR INSERT TO anon WITH CHECK (true);`,
          },
          {
            name: "syntheses",
            lang: "sql",
            code: `CREATE TABLE syntheses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_count INT,
  trigger        TEXT,   -- 'threshold' | 'manual' | 'cron'
  status         TEXT,   -- 'running' | 'complete' | 'failed'
  error          TEXT,
  created_at     TIMESTAMP DEFAULT now()
);

-- Only service_role (server-side) can read or write
ALTER TABLE syntheses ENABLE ROW LEVEL SECURITY;`,
          },
          {
            name: "hitl_proposals",
            lang: "sql",
            code: `CREATE TABLE hitl_proposals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  synthesis_id  UUID REFERENCES syntheses(id),
  lesson_id     INT,
  lesson_title  TEXT,
  severity      TEXT,   -- 'trivial' | 'minor' | 'major'
  type          TEXT,   -- 'typo' | 'accuracy' | 'clarification' | 'example' | 'structure'
  title         TEXT,
  problem       TEXT,
  proposal      TEXT,
  reasoning     TEXT,
  feedback_count INT,
  status        TEXT DEFAULT 'pending',  -- 'pending' | 'approved' | 'dismissed' | 'applied'
  admin_note    TEXT,
  pr_url        TEXT,
  reviewed_at   TIMESTAMP,
  created_at    TIMESTAMP DEFAULT now()
);

ALTER TABLE hitl_proposals ENABLE ROW LEVEL SECURITY;`,
          },
        ]} />

        <Callout kind="tip" title="Where to find your keys">
          <p>In Supabase: <strong>Settings → API</strong>. Copy three things: <strong>Project URL</strong>, <strong>anon / public key</strong> (goes into <code>app.jsx</code>), and <strong>service_role key</strong> (goes into Vercel — never commit it). The anon key is safe in client code because RLS prevents browsers from reading proposals.</p>
        </Callout>

        {/* ── Step 2: GitHub token ── */}
        <div className="cheat-card" style={{ marginTop: 32 }}>
          <div className="cc-item" style={{ gridColumn: "1 / -1" }}>
            <div className="eyebrow">Step 2</div>
            <h4>Create a GitHub fine-grained token</h4>
            <p>Go to <strong>GitHub → Settings → Developer settings → Fine-grained personal access tokens → Generate new token</strong>. Scope it to your course repo only, with these repository permissions:</p>
          </div>
        </div>

        <CodeBlock lang="text" filename="Required token permissions">
{`Contents       → Read and write   (fetch files, commit edits)
Pull requests  → Read and write   (open auto-fix PRs)
Metadata       → Read-only        (required by GitHub for all tokens)`}
        </CodeBlock>

        <Callout kind="warn" title="Scope it to one repo">
          The token only needs access to your course repo. Granting access to all repositories gives the auto-apply sub-agent unnecessary reach — scope it narrowly.
        </Callout>

        {/* ── Step 3: Vercel env vars ── */}
        <div className="cheat-card" style={{ marginTop: 32 }}>
          <div className="cc-item" style={{ gridColumn: "1 / -1" }}>
            <div className="eyebrow">Step 3</div>
            <h4>Add environment variables in Vercel</h4>
            <p>Go to <strong>Vercel project → Settings → Environment Variables</strong>. Add all seven — they apply to all environments (Production, Preview, Development):</p>
          </div>
        </div>

        <CodeBlock lang="bash" filename="Vercel environment variables">
{`ANTHROPIC_API_KEY          # sk-ant-... from console.anthropic.com
SUPABASE_URL               # https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY  # from Supabase Settings → API → service_role
GITHUB_TOKEN               # fine-grained PAT from Step 2
GITHUB_OWNER               # your GitHub username or org name
GITHUB_REPO                # repo name only — not the full URL
SYNTHESIS_THRESHOLD        # optional — omit to use the default of 15`}
        </CodeBlock>

        <Callout kind="note" title="SUPABASE_ANON_KEY is different">
          The anon key lives in <code>app.jsx</code> as a client-side constant — it is not a Vercel env var. The service_role key above is the elevated server-side key used by <code>/api/synthesize</code> and <code>/api/apply</code>. Do not mix them up.
        </Callout>

        {/* ── Step 4: Wire app.jsx ── */}
        <div className="cheat-card" style={{ marginTop: 32 }}>
          <div className="cc-item" style={{ gridColumn: "1 / -1" }}>
            <div className="eyebrow">Step 4</div>
            <h4>Update <code>app.jsx</code> with your Supabase client credentials</h4>
            <p>At the top of <code>app.jsx</code>, replace the two placeholder constants with the values from your Supabase project:</p>
          </div>
        </div>

        <CodeBlock lang="js" filename="app.jsx — lines 3–4">
{`const SUPABASE_URL      = "https://your-project-id.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGci...your-anon-key-here";`}
        </CodeBlock>

        <Callout kind="tip" title="Safe to commit">
          The anon key is designed to be public. Supabase RLS ensures browsers can only INSERT rows into <code>feedback</code> — they cannot read proposals or syntheses. Commit it freely.
        </Callout>

        {/* ── Step 5: Deploy ── */}
        <div className="cheat-card" style={{ marginTop: 32 }}>
          <div className="cc-item" style={{ gridColumn: "1 / -1" }}>
            <div className="eyebrow">Step 5</div>
            <h4>Push to GitHub — Vercel does the rest</h4>
            <p>Vercel auto-detects the <code>/api</code> folder as serverless functions and <code>vercel.json</code> as the cron schedule. One push wires everything:</p>
          </div>
        </div>

        <Terminal
          label="git — course repo"
          lines={[
            { kind: "cmd",  text: "git add app.jsx" },
            { kind: "cmd",  text: 'git commit -m "wire Supabase credentials"' },
            { kind: "cmd",  text: "git push origin main" },
            { kind: "blank" },
            { kind: "out",  text: "Vercel detects push → builds..." },
            { kind: "ok",   text: "✓ Serverless functions: /api/synthesize, /api/apply" },
            { kind: "ok",   text: "✓ Cron job registered: 0 12 * * 4 (Thu 12:00 UTC)" },
            { kind: "ok",   text: "✓ Deployment live" },
          ]}
        />

        <Callout kind="do" title="Verify in Vercel dashboard">
          After deploy: <strong>Project → Functions tab</strong> should list <code>synthesize</code> and <code>apply</code>. <strong>Project → Cron Jobs tab</strong> should show Thursday 12:00 UTC. If Cron Jobs tab is missing, check that <code>vercel.json</code> is at the repo root.
        </Callout>

        {/* ── Step 6: Test ── */}
        <div className="cheat-card" style={{ marginTop: 32 }}>
          <div className="cc-item" style={{ gridColumn: "1 / -1" }}>
            <div className="eyebrow">Step 6</div>
            <h4>Test the full loop end-to-end</h4>
            <p>Submit a test rating, confirm the Supabase write, then trigger your first synthesis manually:</p>
          </div>
        </div>

        <div className="cheat-card" style={{ marginTop: 8 }}>
          <div className="cc-item">
            <div className="eyebrow">6a — Submit feedback</div>
            <p>Rate any lesson. Open <strong>Supabase → Table Editor → feedback</strong>. A new row should appear with <code>synthesized = false</code>. If it doesn't, check that <code>SUPABASE_URL</code> and <code>SUPABASE_ANON_KEY</code> in <code>app.jsx</code> match your project.</p>
          </div>
          <div className="cc-item">
            <div className="eyebrow">6b — Unlock the admin dashboard</div>
            <p>Click the <strong>"AI-Native Designer 101"</strong> brand logo in the sidebar <strong>five times in quick succession</strong> → enter your admin password → you're in.</p>
          </div>
          <div className="cc-item">
            <div className="eyebrow">6c — Run synthesis</div>
            <p>Go to the <strong>Automations</strong> tab → click <strong>"Run synthesis now"</strong>. The manual trigger bypasses the 15-item threshold — you don't need real learner volume to test. A proposal should appear in the <strong>HITL Proposals</strong> tab within 10–15 seconds.</p>
          </div>
          <div className="cc-item">
            <div className="eyebrow">6d — Approve &amp; auto-apply</div>
            <p>Find a <strong>trivial</strong> proposal (moss-coloured badge) → click <strong>Approve</strong> → <strong>Apply automatically</strong>. Check your GitHub repo — a branch named <code>auto-fix/…</code> and a PR should appear within 30 seconds.</p>
          </div>
        </div>

        <Callout kind="tip" title="Cron will take over from here">
          After the initial test, the system runs itself. The Thursday noon cron fires automatically once you have enough real learner feedback. The threshold (default 15) also auto-triggers synthesis mid-week if the course gets traffic.
        </Callout>

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
