// Lessons 10-13 — Files, ship, measure, wrap

const Lesson10 = () => (
  <>
    <div className="eyebrow">Lesson 10 · Build</div>
    <h1 style={{ marginTop: 14, marginBottom: 18 }}>Files an AI-native designer should know</h1>
    <p className="lede">
      You don't have to be a developer. But you'll touch a small set of file types that quietly run modern product work. Knowing them turns chats into commits.
    </p>

    <section>
      <h3>The four formats</h3>
      <CodeTabs files={[
        { name: "guide.md", lang: "md", code:
`# Voice & tone

Plain words. Short sentences. The reader is **busy**.

## Do
- Lead with the verb
- Name the trade-off

## Don't
- "Seamlessly", "unleash", "delight"
- Hedge with adverbs

\`Settings → Profile → Save\` is a pattern, not prose.` },
        { name: "page.mdx", lang: "mdx", code:
`---
title: Pricing
description: Three plans. Pick the one you need today.
---

import { PricingTable, FAQ } from '@/components'

# Pricing

<PricingTable plans={pricing.plans} />

## Common questions
<FAQ items={faq} />` },
        { name: "config.yaml", lang: "yaml", code:
`# Project config — read by Claude Code, CI, Vercel
project: acme-prototype
brand:
  voice: plain, warm, action-oriented
  primary_color: "#CC785C"
deploy:
  provider: vercel
  preview: true
agents:
  default_model: claude-sonnet-4-5
  sub_agents:
    - researcher
    - copy-reviewer` },
        { name: "schema.json", lang: "json", code:
`{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "OnboardingStep",
  "type": "object",
  "required": ["id", "headline", "primary_action"],
  "properties": {
    "id": { "type": "string" },
    "headline": { "type": "string", "maxLength": 60 },
    "subhead":  { "type": "string", "maxLength": 140 },
    "primary_action": {
      "type": "object",
      "properties": {
        "label": { "type": "string", "maxLength": 24 },
        "href":  { "type": "string", "format": "uri" }
      }
    }
  }
}`},
      ]} />
    </section>

    <section>
      <h3>Why each one matters</h3>
      <div className="two-col">
        <div className="cheat-card"><h5>.md — markdown</h5><p>The lingua franca. SKILL.md, READMEs, design briefs, voice guides. If Claude reads it, it's probably markdown.</p></div>
        <div className="cheat-card"><h5>.mdx — markdown + components</h5><p>Markdown that lets you embed React. Documentation sites, marketing pages, product tours.</p></div>
        <div className="cheat-card"><h5>.yaml — config</h5><p>Human-friendly settings. CI pipelines, agent configs, design tokens, Vercel.</p></div>
        <div className="cheat-card"><h5>schema.json</h5><p>The shape of your data. Tell Claude what "valid" means and you'll never debug a typo again.</p></div>
      </div>
    </section>

    <Callout kind="do" title="The 'just learn YAML' rule">
      <p style={{ margin: 0 }}>If a designer learns one new format this year, make it YAML. It unlocks CI, deploys, agent configuration, and most MCP servers — without writing code.</p>
    </Callout>

    <Quiz
      question="Why use a JSON schema for content like onboarding steps?"
      options={[
        "It makes the file smaller",
        "It tells Claude (and humans, and CI) the exact shape and limits — preventing invalid content from shipping",
        "It encrypts the data",
        "It's required by Vercel",
      ]}
      correct={1}
      explain="A schema is a contract. Once written, both the agent and your build pipeline can enforce it."
    />
  </>
);

const Lesson11 = () => (
  <>
    <div className="eyebrow">Lesson 11 · Ship</div>
    <h1 style={{ marginTop: 14, marginBottom: 18 }}>Deploying — GitHub & Vercel without leaving Claude</h1>
    <p className="lede">
      Once your prototype lives in a repo, shipping it is a chat away. GitHub holds the source, Vercel turns every commit into a live preview URL — and both speak MCP.
    </p>

    <section>
      <h3>The path</h3>
      <Terminal
        label="claude — ~/projects/onboarding-prototype"
        lines={[
          { kind: "cmd", text: "ship this to a vercel preview, branch from main" },
          { kind: "out", text: "Plan:" },
          { kind: "out", text: "  1. git checkout -b prototype/onboarding-v3" },
          { kind: "out", text: "  2. git add + commit (auto-message from diff)" },
          { kind: "out", text: "  3. github.create_pr → opens PR" },
          { kind: "out", text: "  4. vercel.deploy → preview URL" },
          { kind: "out", text: "Approve? (y/n)" },
          { kind: "cmd", text: "y" },
          { kind: "ok",  text: "✓ Branch created" },
          { kind: "ok",  text: "✓ Commit: 'feat(onboarding): 4-screen flow + mobile breakpoints'" },
          { kind: "ok",  text: "✓ PR #218 opened" },
          { kind: "ok",  text: "✓ Vercel: https://acme-prototype-git-onboarding-v3.vercel.app" },
          { kind: "out", text: "Posting the URL to #design-crit. Anything else?" },
        ]}
      />
    </section>

    <section>
      <h3>What lives where</h3>
      <div className="two-col">
        <div className="cheat-card"><h5>GitHub</h5><p>Source of truth. Version history, PR reviews, where Skills and configs live next to code.</p></div>
        <div className="cheat-card"><h5>Vercel</h5><p>One URL per branch. Comment-on-element previews. The link you share in Slack.</p></div>
      </div>
    </section>

    <section>
      <h3>Vercel config — minimal</h3>
      <CodeBlock filename="vercel.json" lang="json">
{`{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "git": { "deploymentEnabled": { "main": true } },
  "comments": { "enabled": true }
}`}
      </CodeBlock>
    </section>

    <Callout kind="note" title="The new design review">
      <p style={{ margin: 0 }}>Every PR gets a live URL. Stakeholders comment on the real thing, not a screenshot. Claude reads the comments and proposes the fix. The loop is the work.</p>
    </Callout>

    <TryIt
      label="Practice — write a tight commit message from a diff summary"
      placeholder=""
      defaultPrompt="Write a conventional commit message for this change:\n\n- Added 4 onboarding screens (Welcome, Goals, Workspace, Invite)\n- Added mobile breakpoint at 480px\n- Replaced 'Get started' CTA copy with 'Continue'\n- Fixed avatar drift between Figma and prod\n\nFormat: type(scope): subject (max 72 chars), then 2-3 bullet body."
      hint="↳ aim for type(scope): verb-led summary"
    />

    <Quiz
      question="Why is the per-branch preview URL so important for designers?"
      options={[
        "It saves bandwidth",
        "It lets stakeholders review the real, interactive thing — not a screenshot — before merge",
        "It deploys to App Store",
        "It generates QR codes automatically",
      ]}
      correct={1}
      explain="A live URL collapses the gap between 'designed' and 'experienced'. Comments map to elements. Iteration speeds up by an order of magnitude."
    />
  </>
);

Object.assign(window, { Lesson10, Lesson11 });
