const Anthropic = require("@anthropic-ai/sdk");
const { createClient } = require("@supabase/supabase-js");

const SYNTHESIS_THRESHOLD = parseInt(process.env.SYNTHESIS_THRESHOLD || "15", 10);

module.exports = async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Idempotency guard — reject if a synthesis is already running (< 5 min old)
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data: running } = await supabase
    .from("syntheses")
    .select("id")
    .eq("status", "running")
    .gte("created_at", fiveMinAgo)
    .limit(1);

  if (running && running.length > 0) {
    return res.status(409).json({ busy: true, message: "Synthesis already in progress" });
  }

  // Fetch unsynthesized feedback
  const { data: feedbackRows, error: fetchError } = await supabase
    .from("feedback")
    .select("*")
    .eq("synthesized", false)
    .order("created_at", { ascending: true });

  if (fetchError) {
    return res.status(500).json({ error: "Failed to fetch feedback", details: fetchError.message });
  }

  if (!feedbackRows || feedbackRows.length === 0) {
    return res.status(200).json({ skipped: true, message: "No unsynthesized feedback" });
  }

  // Check threshold for browser-triggered calls (not cron)
  const body = req.body || {};
  if (body.trigger !== "manual" && body.trigger !== "cron" && feedbackRows.length < SYNTHESIS_THRESHOLD) {
    return res.status(200).json({
      skipped: true,
      message: `Only ${feedbackRows.length} items (threshold: ${SYNTHESIS_THRESHOLD})`,
    });
  }

  // Insert running synthesis record
  const { data: synthRow, error: synthInsertError } = await supabase
    .from("syntheses")
    .insert({
      feedback_count: feedbackRows.length,
      trigger: body.trigger || "threshold",
      status: "running",
    })
    .select()
    .single();

  if (synthInsertError) {
    return res.status(500).json({ error: "Failed to create synthesis record", details: synthInsertError.message });
  }

  const synthId = synthRow.id;

  try {
    const payload = feedbackRows.map((f) => ({
      lesson: `${f.lesson_id}: ${f.lesson_title}`,
      type: f.type,
      rating: f.rating,
      comment: f.content,
      date: f.created_at.slice(0, 10),
    }));

    const prompt = `You are a course-content analyst for "AI-Native Designer 101" — a 60-minute design upskill course on Claude, AI agents, MCP, and deploy/measure workflows for product designers.

Below is learner feedback collected since the last synthesis (${feedbackRows.length} items):

${JSON.stringify(payload, null, 2)}

Analyse the feedback and return ONLY a valid JSON array of improvement proposals (no prose, no markdown fencing). If the feedback is uniformly positive and nothing needs changing, return an empty array [].

Schema for each item:
{
  "lessonId": <integer>,
  "lessonTitle": "<string>",
  "severity": "trivial" | "minor" | "major",
  "type": "typo" | "accuracy" | "clarification" | "example" | "structure",
  "title": "<short issue title, ≤ 8 words>",
  "problem": "<what is wrong or unclear, 1–2 sentences>",
  "proposal": "<specific change to make, 1–3 sentences>",
  "reasoning": "<why this matters based on the data, 1 sentence>",
  "feedbackCount": <integer — how many learners mentioned this>
}

Severity guide:
• trivial — typo, broken link, obvious word error. Safe to apply directly.
• minor   — rephrase, add an example, clarify a term. Review before applying.
• major   — rewrite a section, restructure, add/remove content. Plan before implementing.

Group related feedback into one proposal rather than many tiny ones. Omit noise.`;

    const anthropic = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const reply = message.content[0].type === "text" ? message.content[0].text : "";

    let proposals = [];
    try {
      const m = reply.match(/\[[\s\S]*\]/);
      proposals = m ? JSON.parse(m[0]) : [];
    } catch {
      proposals = [];
    }

    // Bulk-insert proposals
    if (proposals.length > 0) {
      const proposalRows = proposals.map((p) => ({
        synthesis_id: synthId,
        lesson_id: p.lessonId,
        lesson_title: p.lessonTitle,
        severity: p.severity,
        type: p.type,
        title: p.title,
        problem: p.problem,
        proposal: p.proposal,
        reasoning: p.reasoning,
        feedback_count: p.feedbackCount || 0,
        status: "pending",
      }));

      await supabase.from("hitl_proposals").insert(proposalRows);
    }

    // Mark feedback as synthesized
    const feedbackIds = feedbackRows.map((f) => f.id);
    await supabase.from("feedback").update({ synthesized: true }).in("id", feedbackIds);

    // Update synthesis record to complete
    await supabase
      .from("syntheses")
      .update({ status: "complete", feedback_count: feedbackRows.length })
      .eq("id", synthId);

    return res.status(200).json({
      synthesisId: synthId,
      feedbackCount: feedbackRows.length,
      proposalCount: proposals.length,
    });
  } catch (err) {
    await supabase
      .from("syntheses")
      .update({ status: "failed", error: err.message })
      .eq("id", synthId);

    return res.status(500).json({ error: "Synthesis failed", details: err.message });
  }
};
