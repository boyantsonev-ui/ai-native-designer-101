---
description: Weekly synthesis of learner feedback for AI-Native Designer 101. Reads exported feedback JSON, runs Claude analysis, and outputs ranked HITL improvement proposals.
schedule: 0 9 * * MON
output: .claude/outputs/synthesis-{{date}}.md
---

# Feedback synthesis — AI-Native Designer 101

## Purpose

Analyse new learner feedback (star ratings + written comments + chat questions) from the course and produce ranked improvement proposals in the same HITL format used by the in-browser Admin Dashboard — but runnable on a weekly schedule without a browser.

## Prerequisites

The file `.claude/outputs/feedback.json` must exist.
Export it from: Admin Dashboard (click brand logo 5×) → Automations tab → "Export feedback.json →".

If the file is missing, print a clear error and stop:
> Error: .claude/outputs/feedback.json not found.
> Export it from the Admin Dashboard → Automations tab first.

## Steps

### 1. Load and parse

Read `.claude/outputs/feedback.json`.
Parse the JSON: `{ feedback: [], syntheses: [], exportedAt: "<ISO date>" }`.

### 2. Filter to unsynthesized

Select only items where `synthesized === false`.
If none, print:
> Nothing new to synthesize — all feedback already processed. No proposals generated.
Then stop.

### 3. Group by lesson

Organise the filtered items by `lessonId`. For each lesson group, note:
- Total item count
- Average star rating (if ratings present)
- Item types: "rating" (star + text) vs "chat" (Q&A pair)

### 4. Analyse each group

Look for these signals:
- **Recurring confusion** — ≥2 items with similar topic, question, or complaint
- **Low-rated + commented** — rating ≤ 2 stars paired with a written comment
- **Chat questions revealing gaps** — questions that a well-written lesson should have pre-empted
- **Positive signals** — note what's working so you don't propose changing it

### 5. Produce proposals

Generate a JSON array. Group related feedback into one proposal rather than many small ones. Omit one-off noise with no discernible pattern.

**Proposal schema (each item):**
```json
{
  "lessonId": <integer>,
  "lessonTitle": "<string>",
  "severity": "trivial | minor | major",
  "type": "typo | accuracy | clarification | example | structure",
  "title": "<issue title — max 8 words>",
  "problem": "<what is wrong or unclear — 1–2 sentences>",
  "proposal": "<specific change to make — 1–3 sentences>",
  "reasoning": "<why this matters based on the data — 1 sentence>",
  "feedbackCount": <integer — how many learners mentioned this>
}
```

**Severity guide:**
- `trivial` — typo, broken link, obvious word error. Safe to apply directly.
- `minor` — rephrase a sentence, add an example, clarify a term. Review before applying.
- `major` — rewrite a section, restructure content, add or remove a lesson. Plan before implementing.

If the feedback is uniformly positive and no improvements are warranted, return an empty JSON array `[]` and say so explicitly.

### 6. Write output

Write the full JSON array to `.claude/outputs/synthesis-{{date}}.md`.

Also print a one-line summary to stdout:
```
Synthesis complete: N proposals (X trivial · Y minor · Z major) from K feedback items across L lessons.
```

## Notes for the course team

- To import these proposals back into the browser HITL interface, the Admin Dashboard would need a server-side API endpoint. For now, proposals live in the output file — review them there and action accordingly.
- Approved trivial/minor proposals can be applied directly with Claude Code: open the relevant lessons-*.jsx file and describe the fix.
- Major proposals should be scoped in a GitHub issue or planning document before touching course content.
- Re-run anytime manually with: `claude run feedback-synthesis`
- The weekly schedule (`0 9 * * MON`) can be updated via the scheduled-tasks MCP from Claude Desktop.
