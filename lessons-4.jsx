// Lessons 12-13 — Measure + Wrap

const Lesson12 = () => (
  <>
    <div className="eyebrow">Lesson 12 · Measure</div>
    <h1 style={{ marginTop: 14, marginBottom: 18 }}>Measuring prototypes — analytics through MCP</h1>
    <p className="lede">
      Designs without signal are opinions. With analytics MCP servers, Claude can pull behavioural data from PostHog, Microsoft Clarity, and Hotjar — and synthesize it into design changes you can ship the same afternoon.
    </p>

    <section>
      <h3>The three sources, in one chat</h3>
      <div className="two-col">
        <div className="cheat-card"><h5>PostHog</h5><p>Funnels, feature flags, A/B tests, session events. The "what happened" layer.</p></div>
        <div className="cheat-card"><h5>Microsoft Clarity</h5><p>Heatmaps, rage clicks, dead clicks — free, fast to install. The "where it hurt" layer.</p></div>
        <div className="cheat-card"><h5>Hotjar</h5><p>Recordings, surveys, on-page polls. The "why they did it" layer.</p></div>
      </div>
    </section>

    <section>
      <h3>What a measurement chat looks like</h3>
      <ChatMock
        title="Claude · posthog + clarity + hotjar"
        messages={[
          { role: "user", text: "The new onboarding has been live 48h. How is it performing? Anything to fix this week?" },
          { role: "ai",
            toolCall: { name: "posthog.funnel('onboarding-v3', 48h)", body: "→ 4 steps · 1,284 starts" },
            text: "Pulling the funnel + the heatmaps + a sample of session recordings." },
          { role: "ai",
            toolCall: { name: "clarity.heatmap('/onboarding/2')", body: "→ rage-click cluster on 'Skip'" },
            text: "" },
          { role: "ai",
            toolCall: { name: "hotjar.recordings(filter='dropoff_step_2')", body: "→ 23 recordings · avg 14s on page" },
            text: "Three findings, ranked:\n\n① Step 2 → 3 drop is 38% (target was <20%). Heatmap shows rage-clicks on the disabled 'Continue' — copy doesn't say a field is required.\n\n② Mobile users skim; recordings show thumb-only scroll. The illustration above the fold is pushing the form out of view on iPhone SE.\n\n③ The 'Skip for now' link is being clicked 4× more than the primary CTA on Step 4. Either remove it or make 'Skip' actually skip (it currently re-prompts).\n\nWant me to mock fixes 1 and 2 in Figma and open PRs for 3?" },
        ]}
      />
    </section>

    <section>
      <h3>Connecting the servers</h3>
      <CodeBlock filename="claude_desktop_config.json (excerpt)" lang="json">
{`{
  "mcpServers": {
    "posthog":  { "command": "uvx", "args": ["posthog-mcp"],  "env": { "POSTHOG_API_KEY": "phx_..." } },
    "clarity":  { "command": "npx", "args": ["-y", "clarity-mcp-server"], "env": { "CLARITY_API_TOKEN": "..." } },
    "hotjar":   { "command": "npx", "args": ["-y", "@hotjar/mcp"], "env": { "HOTJAR_TOKEN": "..." } }
  }
}`}
      </CodeBlock>
    </section>

    <Callout kind="do" title="The new loop">
      <p style={{ margin: 0 }}>Ship → instrument → ask Claude → fix → ship. The cycle that used to take a sprint can now happen in an afternoon. The bottleneck is no longer access to data — it's <em>knowing what to ask</em>.</p>
    </Callout>

    <TryIt
      label="Practice — write the first question you'd ask Claude after launch"
      placeholder=""
      defaultPrompt="I just shipped a new pricing page. Write the 5 most useful, specific questions I should ask Claude — assuming it has PostHog, Clarity, and Hotjar connected — to learn whether the redesign is working. Make the questions surgical (named events, time windows, segments)."
      hint="↳ specific questions get specific answers"
    />

    <QuizTiered tiers={[
      {
        label: "Beginner",
        question: "What type of data does Microsoft Clarity provide that PostHog doesn't focus on?",
        options: [
          "Funnel conversion rates",
          "A/B test results",
          "Heatmaps, rage clicks, and session recordings",
          "Custom event tracking",
        ],
        correct: 2,
        explain: "Clarity specializes in visual behavioral data — where people click, scroll, rage click, and dead-zone. PostHog focuses on structured event analytics and funnels. They complement each other.",
      },
      {
        label: "Intermediate",
        question: "Why combine PostHog, Clarity, and Hotjar instead of using just one?",
        options: [
          "Redundancy in case one is down",
          "They overlap perfectly — pick the cheapest",
          "Each answers a different question: what happened, where it hurt, why they did it",
          "They're all required for GDPR",
        ],
        correct: 2,
        explain: "The three lenses compose. Quant tells you something is wrong; heatmaps localize it; recordings explain it.",
      },
      {
        label: "Advanced",
        question: "PostHog shows a drop from Step 2 to Step 3. Clarity shows rage clicks in the same area. How do you use both to form a design hypothesis?",
        options: [
          "Pick the signal you trust more and discard the other",
          "Report both numbers in a doc and wait for more data",
          "Cross-reference the rage click location with the exact UI element at Step 2 to identify the friction point",
          "Run an A/B test immediately with any change",
        ],
        correct: 2,
        explain: "Quantitative data tells you where the problem is; behavioral data tells you what the friction looks like. The intersection gives you a specific, actionable design hypothesis — not just a number to explain.",
      },
    ]} />
  </>
);

const Lesson13 = () => (
  <>
    <HeroCard
      eyebrow="Lesson 13 · You're done"
      title="From designer to director."
      lede="You now know enough to compose Claude, MCP servers, agents, and analytics into a real product loop. The rest is reps."
      meta={["Glossary in sidebar", "Save this page"]}
    />

    <section>
      <h3>What you learned, condensed</h3>
      <div className="cheat-preview">
        <div className="cheat-card"><h5>1. Two surfaces</h5><p>Claude Desktop for thinking. Claude Code for building.</p></div>
        <div className="cheat-card"><h5>2. Skills</h5><p>SKILL.md = your taste, versioned and discoverable.</p></div>
        <div className="cheat-card"><h5>3. Workflows vs agents</h5><p>Workflows: code controls flow. Agents: model controls flow.</p></div>
        <div className="cheat-card"><h5>4. Sub-agents</h5><p>Orchestrator + workers. Different prompts, tools, models.</p></div>
        <div className="cheat-card"><h5>5. MCP</h5><p>One protocol, every tool. Compose servers; permission tightly.</p></div>
        <div className="cheat-card"><h5>6. Figma + Console MCP</h5><p>Designs as queryable resource; live page as comparable reality.</p></div>
        <div className="cheat-card"><h5>7. .md / .mdx / .yaml / schema.json</h5><p>The four file types that turn chat into commits.</p></div>
        <div className="cheat-card"><h5>8. GitHub + Vercel</h5><p>One PR, one preview URL, one fast review loop.</p></div>
        <div className="cheat-card"><h5>9. PostHog · Clarity · Hotjar</h5><p>What · where · why. Combine via MCP.</p></div>
        <div className="cheat-card"><h5>10. The brief is the work</h5><p>Agent leverage scales with the clarity of your intent.</p></div>
      </div>
    </section>

    <section>
      <h3>Your next 7 days</h3>
      <ol style={{ paddingLeft: 18, color: "var(--ink-2)" }}>
        <li>Install Claude Desktop. Add the Figma MCP and one analytics MCP.</li>
        <li>Write your first SKILL.md — pick something you brief weekly.</li>
        <li>Write a CLAUDE.md for your current project repo. Five minutes; save an hour.</li>
        <li>Open Claude Code in an existing prototype repo. Ask it to add one feature.</li>
        <li>Ship a Vercel preview from a chat. Share the URL.</li>
        <li>Set up a weekly routine — create <code>.claude/commands/feedback-synthesis.md</code>, export a feedback JSON, and schedule it via the scheduled-tasks MCP.</li>
        <li>Teach a colleague this loop. Teaching is when it sticks.</li>
      </ol>
    </section>

    <Callout kind="do" title="Keep the Glossary handy">
      <p>The Glossary in the sidebar covers every concept, pattern, and acronym introduced in this course. Open it whenever you need a quick refresher.</p>
    </Callout>

    <QuizTiered tiers={[
      {
        label: "Beginner",
        question: "Which habit is most useful to build as an AI-native designer?",
        options: [
          "Learning to write Python scripts",
          "Reviewing AI outputs before shipping and encoding corrections as Skills",
          "Using AI for every task, even simple ones",
          "Switching to a fully code-first workflow",
        ],
        correct: 1,
        explain: "The review-and-encode loop is what separates AI-assisted from AI-dependent. You catch errors, identify what works, and encode good patterns as Skills — making each session better than the last.",
      },
      {
        label: "Intermediate",
        question: "The single most important habit of an AI-native designer is…",
        options: [
          "Using the newest model",
          "Writing a sharper brief",
          "Owning the most MCP servers",
          "Coding faster than engineers",
        ],
        correct: 1,
        explain: "Tools change every quarter. The brief — the precision of intent — is the durable skill.",
      },
      {
        label: "Advanced",
        question: "A design team uses Claude for all spec work. After three months, output quality plateaus. What's the most likely systemic cause?",
        options: [
          "The model needs fine-tuning on the team's designs",
          "The team's prompts are too long — they need shortening",
          "No one has encoded learnings back into shared Skills and CLAUDE.md",
          "The team needs a more powerful model",
        ],
        correct: 2,
        explain: "Plateau happens when teams extract value but don't reinvest it. Skills and CLAUDE.md are the team's institutional memory for AI. Without systematic encoding of what works, each session starts from the same baseline.",
      },
    ]} />

    <div style={{ textAlign: "center", marginTop: 60, paddingTop: 40, borderTop: "1px solid var(--rule)" }}>
      <div className="eyebrow" style={{ justifyContent: "center", display: "inline-flex" }}>End of course</div>
      <p style={{ fontFamily: "var(--serif)", fontSize: 24, marginTop: 18, color: "var(--ink)" }}>
        Now go ship something a designer couldn't ship a year ago.
      </p>
    </div>
  </>
);

Object.assign(window, { Lesson12, Lesson13 });
