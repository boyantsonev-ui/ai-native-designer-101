const Anthropic = require("@anthropic-ai/sdk");
const { createClient } = require("@supabase/supabase-js");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { proposalId } = req.body || {};
  if (!proposalId) {
    return res.status(400).json({ error: "proposalId is required" });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Fetch and validate the proposal
  const { data: proposal, error: fetchError } = await supabase
    .from("hitl_proposals")
    .select("*")
    .eq("id", proposalId)
    .single();

  if (fetchError || !proposal) {
    return res.status(404).json({ error: "Proposal not found" });
  }
  if (proposal.severity !== "trivial") {
    return res.status(400).json({ error: "Only trivial proposals can be auto-applied" });
  }
  if (proposal.status !== "approved") {
    return res.status(400).json({ error: "Proposal must be approved before applying" });
  }
  if (proposal.status === "applied") {
    return res.status(400).json({ error: "Proposal already applied", prUrl: proposal.pr_url });
  }

  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;

  if (!owner || !repo || !token) {
    return res.status(500).json({ error: "GitHub env vars not configured" });
  }

  // Map lesson_id to the file that contains it
  const lessonFileMap = {
    1: "lessons-1.jsx", 2: "lessons-1.jsx", 3: "lessons-1.jsx", 4: "lessons-1.jsx",
    5: "lessons-2.jsx", 6: "lessons-2.jsx", 7: "lessons-2.jsx",
    8: "lessons-2.jsx", 9: "lessons-2.jsx", 10: "lessons-3.jsx",
    11: "lessons-3.jsx", 12: "lessons-4.jsx", 13: "lessons-4.jsx",
    14: "lessons-5.jsx",
  };
  const targetFile = lessonFileMap[proposal.lesson_id] || "lessons-1.jsx";

  const ghHeaders = {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
    "User-Agent": "ai-native-designer-101-auto-apply",
  };

  // Fetch current file from GitHub main branch
  const fileRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${targetFile}`,
    { headers: ghHeaders }
  );

  if (!fileRes.ok) {
    const text = await fileRes.text();
    return res.status(500).json({ error: "Failed to fetch file from GitHub", details: text });
  }

  const fileData = await fileRes.json();
  const originalContent = Buffer.from(fileData.content, "base64").toString("utf-8");
  const fileSha = fileData.sha;

  // Apply the fix via Claude
  const anthropic = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });

  const applyPrompt = `You are applying a minimal, targeted fix to a React JSX lesson file for the course "AI-Native Designer 101".

Proposal title: ${proposal.title}
Problem: ${proposal.problem}
Fix to apply: ${proposal.proposal}

RULES:
- Make ONLY the minimal change described. Do not rewrite, reformat, or improve anything else.
- Return the COMPLETE file content with only the fix applied.
- Do not add any explanation, comments, or markdown fencing — return raw file content only.
- If you cannot confidently apply the fix (e.g. the problem location is ambiguous), return the original file unchanged.

FILE CONTENT:
${originalContent}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [{ role: "user", content: applyPrompt }],
  });

  const updatedContent = message.content[0].type === "text" ? message.content[0].text : originalContent;

  // Create a new branch
  const shortId = proposalId.slice(0, 8);
  const branchName = `auto-fix/${shortId}`;

  // Get the SHA of main branch HEAD
  const mainRefRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/main`,
    { headers: ghHeaders }
  );
  if (!mainRefRes.ok) {
    return res.status(500).json({ error: "Failed to get main branch ref" });
  }
  const mainRef = await mainRefRes.json();
  const mainSha = mainRef.object.sha;

  // Create branch
  const createBranchRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/refs`,
    {
      method: "POST",
      headers: ghHeaders,
      body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: mainSha }),
    }
  );
  if (!createBranchRes.ok) {
    const text = await createBranchRes.text();
    return res.status(500).json({ error: "Failed to create branch", details: text });
  }

  // Commit the updated file to the new branch
  const updateFileRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${targetFile}`,
    {
      method: "PUT",
      headers: ghHeaders,
      body: JSON.stringify({
        message: `auto-fix: ${proposal.title}\n\nHTIL proposal ${proposalId}\nLesson ${proposal.lesson_id}: ${proposal.lesson_title}\nFeedback count: ${proposal.feedback_count}`,
        content: Buffer.from(updatedContent).toString("base64"),
        sha: fileSha,
        branch: branchName,
      }),
    }
  );
  if (!updateFileRes.ok) {
    const text = await updateFileRes.text();
    return res.status(500).json({ error: "Failed to commit file", details: text });
  }

  // Open a PR
  const prRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls`,
    {
      method: "POST",
      headers: ghHeaders,
      body: JSON.stringify({
        title: `[auto-fix] ${proposal.title}`,
        body: `## Auto-applied HITL proposal\n\n**Lesson:** ${proposal.lesson_id} — ${proposal.lesson_title}\n**Severity:** ${proposal.severity}\n**Problem:** ${proposal.problem}\n**Fix applied:** ${proposal.proposal}\n**Reasoning:** ${proposal.reasoning}\n**Feedback count:** ${proposal.feedback_count}\n**Proposal ID:** \`${proposalId}\`\n\n---\n*Generated by the AI-Native Designer 101 learning loop. Review the Vercel preview before merging.*`,
        head: branchName,
        base: "main",
      }),
    }
  );
  if (!prRes.ok) {
    const text = await prRes.text();
    return res.status(500).json({ error: "Failed to create PR", details: text });
  }

  const pr = await prRes.json();
  const prUrl = pr.html_url;

  // Update proposal status in Supabase
  await supabase
    .from("hitl_proposals")
    .update({ status: "applied", pr_url: prUrl, reviewed_at: new Date().toISOString() })
    .eq("id", proposalId);

  return res.status(200).json({ prUrl });
};
