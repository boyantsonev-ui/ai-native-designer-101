// Learning Loop — Feedback panel, synthesis engine, HITL admin dashboard
// All state is localStorage-backed; swap saveFeedback / loadFeedback for an
// API call when a backend is ready.

// ─────────────────────────────────────────────────────────────────────────────
// Data layer
// ─────────────────────────────────────────────────────────────────────────────

const FB_KEY    = "ai-native-101::feedback::v1";
const SYNTH_KEY = "ai-native-101::synthesis::v1";

function loadFeedback()   { try { return JSON.parse(localStorage.getItem(FB_KEY))    || []; } catch { return []; } }
function saveFeedback(d)  { try { localStorage.setItem(FB_KEY,    JSON.stringify(d)); } catch {} }
function loadSyntheses()  { try { return JSON.parse(localStorage.getItem(SYNTH_KEY)) || []; } catch { return []; } }
function saveSyntheses(d) { try { localStorage.setItem(SYNTH_KEY, JSON.stringify(d)); } catch {} }

function exportFeedbackJSON() {
  const feedback  = loadFeedback();
  const syntheses = loadSyntheses();
  const payload   = JSON.stringify({ feedback, syntheses, exportedAt: new Date().toISOString() }, null, 2);
  const blob      = new Blob([payload], { type: "application/json" });
  const url       = URL.createObjectURL(blob);
  const a         = Object.assign(document.createElement("a"), { href: url, download: "feedback-export-" + new Date().toISOString().slice(0, 10) + ".json" });
  a.click();
  URL.revokeObjectURL(url);
}

function pushFeedback(item) {
  const all  = loadFeedback();
  const next = { ...item, id: crypto.randomUUID(), timestamp: new Date().toISOString(), synthesized: false };
  all.push(next);
  saveFeedback(all);

  // Async write to Supabase (fire-and-forget; localStorage is the source of truth if offline)
  if (window.__supabase) {
    window.__supabase.from("feedback").insert({
      lesson_id:    next.lessonId,
      lesson_title: next.lessonTitle,
      type:         next.type,
      content:      next.content,
      rating:       next.rating,
      sentiment:    next.sentiment,
    }).then(async () => {
      // Threshold trigger — use global Supabase count, not local localStorage count
      const { count } = await window.__supabase
        .from("feedback")
        .select("id", { count: "exact", head: true })
        .eq("synthesized", false);
      const threshold = 10;
      if ((count ?? 0) >= threshold) {
        fetch("/api/synthesize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trigger: "threshold" }),
        }).catch(() => {});
      }
    }).catch(() => {});
  }

  return all;
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-lesson Feedback Panel
// ─────────────────────────────────────────────────────────────────────────────

function FeedbackPanel({ lessonId, lessonTitle }) {
  const [tab,          setTab]          = useState("rate");
  const [rating,       setRating]       = useState(0);
  const [hoverStar,    setHoverStar]    = useState(0);
  const [text,         setText]         = useState("");
  const [submitted,    setSubmitted]    = useState(false);
  const [chatHistory,  setChatHistory]  = useState([]);
  const [chatInput,    setChatInput]    = useState("");
  const [chatBusy,     setChatBusy]     = useState(false);
  const chatEndRef = useRef(null);

  // Count responses already stored for this lesson
  const [responseCount, setResponseCount] = useState(
    () => loadFeedback().filter(f => f.lessonId === lessonId).length
  );

  const submitRating = () => {
    if (!rating && !text.trim()) return;
    pushFeedback({
      lessonId, lessonTitle,
      type: "rating",
      content: text.trim(),
      rating,
      sentiment: rating >= 4 ? "positive" : rating >= 3 ? "neutral" : "negative",
    });
    setSubmitted(true);
    setResponseCount(c => c + 1);
  };

  const sendChat = async () => {
    const q = chatInput.trim();
    if (!q || chatBusy) return;
    setChatInput("");
    setChatHistory(h => [...h, { role: "user", text: q }]);
    setChatBusy(true);
    try {
      const system = `You are a concise, practical tutor for "AI-Native Designer 101", a 60-minute upskill course about Claude, AI agents, MCP servers, and deploying with GitHub/Vercel — aimed at product designers. The learner is on Lesson ${lessonId}: "${lessonTitle}". Answer in 2–4 sentences max. Use plain language; no jargon without an explanation.`;
      const r = await window.claude.complete({ messages: [{ role: "user", content: system + "\n\n" + q }] });
      setChatHistory(h => [...h, { role: "ai", text: r }]);
      // Record the conversation as feedback for synthesis
      pushFeedback({
        lessonId, lessonTitle,
        type: "chat",
        content: `Q: ${q}\nA: ${r}`,
        rating: null,
        sentiment: "neutral",
      });
      setResponseCount(c => c + 1);
    } catch {
      setChatHistory(h => [...h, { role: "ai", text: "I'm not reachable right now — but your question has been logged for the course team." }]);
    } finally {
      setChatBusy(false);
    }
  };

  // Scroll chat to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, chatBusy]);

  return (
    <div className="fp-wrap">
      <div className="fp-head">
        <div className="fp-tabs">
          <button className={"fp-tab" + (tab === "rate" ? " active" : "")} onClick={() => setTab("rate")}>
            Rate this lesson
          </button>
          <button className={"fp-tab" + (tab === "chat" ? " active" : "")} onClick={() => setTab("chat")}>
            Ask a question
          </button>
        </div>
        {responseCount > 0 && (
          <span className="fp-count mono">
            {responseCount} response{responseCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ── RATE TAB ── */}
      {tab === "rate" && (
        submitted ? (
          <div className="fp-thanks">
            <span className="fp-thanks-icon">✓</span>
            <div>
              <strong>Thanks — feedback logged.</strong>
              <p style={{ margin: "4px 0 0", color: "var(--ink-3)" }}>
                The course team reviews all responses weekly and synthesizes improvements.
              </p>
            </div>
          </div>
        ) : (
          <div className="fp-body">
            <div className="fp-stars">
              {[1, 2, 3, 4, 5].map(s => (
                <button
                  key={s}
                  className={"fp-star" + (s <= (hoverStar || rating) ? " lit" : "")}
                  onMouseEnter={() => setHoverStar(s)}
                  onMouseLeave={() => setHoverStar(0)}
                  onClick={() => setRating(s)}
                  aria-label={`Rate ${s} star${s !== 1 ? "s" : ""}`}
                >★</button>
              ))}
              {rating > 0 && (
                <span className="mono fp-star-label">
                  {["", "Not useful", "Below expectations", "Decent", "Very good", "Excellent"][rating]}
                </span>
              )}
            </div>
            <textarea
              className="fp-textarea"
              rows={3}
              placeholder="What worked? What was unclear or missing? (optional)"
              value={text}
              onChange={e => setText(e.target.value)}
            />
            <div className="fp-actions">
              <button
                className="btn btn-clay"
                onClick={submitRating}
                disabled={!rating && !text.trim()}
              >
                Submit feedback →
              </button>
              <span className="mono fp-note">Read by the course team · synthesized weekly</span>
            </div>
          </div>
        )
      )}

      {/* ── CHAT TAB ── */}
      {tab === "chat" && (
        <div className="fp-chat">
          <div className="fp-chat-thread">
            {chatHistory.length === 0 && (
              <div className="fp-chat-empty mono">
                Ask anything about this lesson — a concept, an example, or "what does X mean here?"
              </div>
            )}
            {chatHistory.map((m, i) => (
              <div key={i} className={"fp-msg fp-msg-" + m.role}>{m.text}</div>
            ))}
            {chatBusy && (
              <div className="fp-msg fp-msg-ai fp-msg-thinking">
                <span className="fp-dots"><i /><i /><i /></span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="fp-chat-input">
            <input
              type="text"
              placeholder="What's unclear, or what do you want to dig into?"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendChat()}
              disabled={chatBusy}
              autoComplete="off"
            />
            <button
              className="btn btn-clay fp-send"
              onClick={sendChat}
              disabled={chatBusy || !chatInput.trim()}
            >→</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HITL severity config
// ─────────────────────────────────────────────────────────────────────────────

const SEV = {
  trivial: {
    label: "Trivial",
    color: "#5B6A3A",      // moss
    bg: "rgba(91,106,58,0.10)",
    border: "rgba(91,106,58,0.30)",
    desc: "Typo, broken link, small wording fix — safe to change directly",
  },
  minor: {
    label: "Minor",
    color: "#D9A441",      // amber
    bg: "rgba(217,164,65,0.10)",
    border: "rgba(217,164,65,0.35)",
    desc: "Clarification, rephrase, add or swap an example — review before applying",
  },
  major: {
    label: "Major",
    color: "#CC785C",      // clay
    bg: "rgba(204,120,92,0.10)",
    border: "rgba(204,120,92,0.30)",
    desc: "Section rewrite, structural change, new lesson — plan before implementing",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HITL Card
// ─────────────────────────────────────────────────────────────────────────────

function HITLCard({ proposal, onApprove, onDismiss, onApplyAuto, applyBusy }) {
  const [expanded, setExpanded]   = useState(proposal.status === "pending");
  const [note, setNote]           = useState(proposal.adminNote || proposal.admin_note || "");
  const sev     = SEV[proposal.severity] || SEV.minor;
  const done    = proposal.status !== "pending";
  const applied = proposal.status === "applied";

  return (
    <div className={"hitl-card" + (done ? " hitl-done" : "")}>
      {/* ── Card header (always visible) ── */}
      <div className="hitl-card-head" onClick={() => setExpanded(e => !e)}>
        <div className="hitl-card-meta">
          <span
            className="sev-badge"
            style={{ background: sev.bg, color: sev.color, borderColor: sev.border }}
          >{sev.label}</span>
          <span className="hitl-type-tag">{proposal.type}</span>
          <span className="hitl-title">{proposal.title}</span>
          <span className="mono hitl-lesson-tag">
            L{String(proposal.lessonId).padStart(2, "0")}
          </span>
        </div>
        <div className="hitl-card-aside">
          {proposal.feedbackCount > 0 && (
            <span className="mono hitl-mentions">
              {proposal.feedbackCount} mention{proposal.feedbackCount !== 1 ? "s" : ""}
            </span>
          )}
          {done ? (
            <span
              className="sev-badge"
              style={applied
                ? { background: "rgba(74,99,120,0.12)", color: "#4A6378", borderColor: "rgba(74,99,120,0.30)" }
                : proposal.status === "approved"
                  ? { background: SEV.trivial.bg, color: SEV.trivial.color, borderColor: SEV.trivial.border }
                  : { background: "rgba(107,106,99,0.12)", color: "var(--ink-3)", borderColor: "rgba(107,106,99,0.25)" }
              }
            >
              {applied ? "↗ Applied" : proposal.status === "approved" ? "✓ Approved" : "Dismissed"}
            </span>
          ) : (
            <span className="hitl-chevron">{expanded ? "▲" : "▼"}</span>
          )}
        </div>
      </div>

      {/* ── Expanded body ── */}
      {expanded && (
        <div className="hitl-card-body">
          <div className="hitl-field">
            <div className="hitl-field-label mono">Problem</div>
            <div className="hitl-field-value">{proposal.problem}</div>
          </div>
          <div className="hitl-field">
            <div className="hitl-field-label mono">Proposal</div>
            <div className="hitl-field-value">{proposal.proposal}</div>
          </div>
          <div className="hitl-field">
            <div className="hitl-field-label mono">Reasoning</div>
            <div className="hitl-field-value" style={{ color: "var(--ink-3)" }}>{proposal.reasoning}</div>
          </div>

          {proposal.severity === "major" && !done && (
            <div className="callout warn" style={{ margin: "12px 0 4px" }}>
              <div className="callout-icon">!</div>
              <div>
                <strong>Planning required before implementing</strong>
                <p style={{ margin: 0 }}>
                  Major changes should be scoped and drafted before touching course content. Approving here marks it as "ready for planning" — not for immediate deployment. Add your guidance in the note field.
                </p>
              </div>
            </div>
          )}

          {!done && (
            <>
              <div className="hitl-field" style={{ marginTop: 12 }}>
                <div className="hitl-field-label mono">
                  Your guidance
                  {proposal.severity === "major" ? " (add scope / caveats before approving)" : " (optional)"}
                </div>
                <textarea
                  className="hitl-note"
                  rows={2}
                  placeholder={
                    proposal.severity === "major"
                      ? "e.g. 'Rewrite the first two paragraphs only, keep the quiz. Check with Mia before shipping.'"
                      : "e.g. 'Fix typo in line 3 — confirmed correct spelling is…'"
                  }
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>
              <div className="hitl-actions">
                <button className="btn btn-clay" onClick={() => onApprove(note)}>
                  {proposal.severity === "major" ? "Approve for planning →" : "Approve →"}
                </button>
                <button className="btn btn-ghost" onClick={() => onDismiss(note)}>
                  Dismiss
                </button>
              </div>
            </>
          )}

          {proposal.status === "approved" && proposal.severity === "trivial" && onApplyAuto && (
            <div className="hitl-actions" style={{ marginTop: 8 }}>
              <button
                className="btn"
                style={{ borderColor: "#4A6378", color: "#4A6378" }}
                onClick={onApplyAuto}
                disabled={applyBusy}
              >
                {applyBusy ? "Opening PR…" : "Apply automatically →"}
              </button>
              <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>
                Opens a GitHub PR · you review &amp; merge
              </span>
            </div>
          )}

          {applied && (proposal.pr_url) && (
            <div className="hitl-field" style={{ marginTop: 8 }}>
              <div className="hitl-field-label mono">Pull request</div>
              <a
                href={proposal.pr_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#4A6378", fontSize: 13 }}
              >
                {proposal.pr_url} ↗
              </a>
            </div>
          )}

          {done && (proposal.adminNote || proposal.admin_note) && (
            <div className="hitl-field" style={{ marginTop: 8 }}>
              <div className="hitl-field-label mono">Admin note</div>
              <div className="hitl-field-value" style={{ color: "var(--ink-3)" }}>
                {proposal.adminNote || proposal.admin_note}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin gate — password prompt before AdminDashboard
// SHA-256 of the admin password (never store the plain password here).
// To change: run in browser console:
//   crypto.subtle.digest('SHA-256', new TextEncoder().encode('yourpassword'))
//     .then(b => console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')))
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_HASH    = "8ae0ce71a1627cbff3f7bee95c6829ca53d549eb76c440108752d33ad7b51d92";
const ADMIN_SESSION = "ai-native-101::admin";

function AdminGate({ onUnlock, onCancel }) {
  const [pw,    setPw]    = useState("");
  const [error, setError] = useState(false);
  const [busy,  setBusy]  = useState(false);

  const check = async () => {
    if (!pw || busy) return;
    setBusy(true);
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pw));
    const hex = [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2, "0")).join("");
    if (hex === ADMIN_HASH) {
      sessionStorage.setItem(ADMIN_SESSION, "1");
      onUnlock();
    } else {
      setError(true);
      setPw("");
      setTimeout(() => setError(false), 2000);
    }
    setBusy(false);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal-head">
          <div>
            <div className="eyebrow">Admin</div>
            <h3 style={{ marginTop: 6 }}>Admin access</h3>
          </div>
          <button className="btn btn-ghost" onClick={onCancel}>✕</button>
        </div>
        <div className="modal-body" style={{ padding: "24px 28px 28px" }}>
          <input
            type="password"
            className="glossary-search"
            placeholder="Password"
            value={pw}
            autoFocus
            onChange={e => { setPw(e.target.value); setError(false); }}
            onKeyDown={e => e.key === "Enter" && check()}
          />
          {error && (
            <p style={{ color: "var(--clay)", margin: "8px 0 0", fontSize: 13 }}>
              Incorrect password.
            </p>
          )}
          <button
            className="btn btn-clay"
            style={{ marginTop: 16, width: "100%", justifyContent: "center" }}
            onClick={check}
            disabled={busy || !pw}
          >
            {busy ? "Checking…" : "Unlock →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Routine Scheduler — schedule editor for the automations tab
// ─────────────────────────────────────────────────────────────────────────────

const ROUTINE_SCHED_KEY = "ai-native-101::routine::v1";

function loadRoutineSettings() {
  try { return JSON.parse(localStorage.getItem(ROUTINE_SCHED_KEY)) || null; } catch { return null; }
}
function saveRoutineSettings(s) {
  try { localStorage.setItem(ROUTINE_SCHED_KEY, JSON.stringify(s)); } catch {}
}

function RoutineScheduler({ onCronChange }) {
  const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const DAY_CRON  = ["SUN","MON","TUE","WED","THU","FRI","SAT"];

  const DEFAULT = { frequency: "weekly", dayOfWeek: 1, dayOfMonth: 1, hour: 9, minute: 0 };

  const [s, setS]       = useState(() => loadRoutineSettings() || DEFAULT);
  const [editing, setEditing] = useState(false);
  const [saved,   setSaved]   = useState(false);

  const toCron = (v) => {
    if (v.frequency === "daily")   return v.minute + " " + v.hour + " * * *";
    if (v.frequency === "weekly")  return v.minute + " " + v.hour + " * * " + DAY_CRON[v.dayOfWeek];
    if (v.frequency === "monthly") return v.minute + " " + v.hour + " " + v.dayOfMonth + " * *";
    return "0 9 * * MON";
  };

  const toHuman = (v) => {
    var t = String(v.hour).padStart(2,"0") + ":" + String(v.minute).padStart(2,"0");
    if (v.frequency === "daily")   return "Daily at " + t;
    if (v.frequency === "weekly")  return "Every " + DAY_NAMES[v.dayOfWeek] + " at " + t;
    if (v.frequency === "monthly") {
      var suf = v.dayOfMonth === 1 ? "st" : v.dayOfMonth === 2 ? "nd" : v.dayOfMonth === 3 ? "rd" : "th";
      return v.dayOfMonth + suf + " of every month at " + t;
    }
    return "";
  };

  const cron  = toCron(s);
  const human = toHuman(s);

  useEffect(() => { if (onCronChange) onCronChange(cron, human); }, [cron]);

  const apply = (patch) => { setS(prev => ({ ...prev, ...patch })); };

  const save = () => {
    saveRoutineSettings(s);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const PRESETS = [
    { label: "Every Mon 9am",   v: { frequency:"weekly",  dayOfWeek:1, dayOfMonth:1, hour:9,  minute:0 } },
    { label: "Daily 9am",       v: { frequency:"daily",   dayOfWeek:1, dayOfMonth:1, hour:9,  minute:0 } },
    { label: "Daily 6pm",       v: { frequency:"daily",   dayOfWeek:1, dayOfMonth:1, hour:18, minute:0 } },
    { label: "Every Fri 4pm",   v: { frequency:"weekly",  dayOfWeek:5, dayOfMonth:1, hour:16, minute:0 } },
    { label: "1st of month 9am",v: { frequency:"monthly", dayOfWeek:1, dayOfMonth:1, hour:9,  minute:0 } },
  ];

  return (
    <div className="routine-scheduler">
      {/* Current schedule row */}
      <div className="rs-current">
        <div className="rs-current-info">
          <code className="rs-cron">{cron}</code>
          <span className="rs-human">{human}</span>
        </div>
        <button
          className={"btn btn-ghost rs-edit-btn" + (editing ? " active" : "")}
          onClick={() => setEditing(e => !e)}
        >
          {editing ? "Cancel" : "Edit schedule →"}
        </button>
      </div>

      {/* Editor panel */}
      {editing && (
        <div className="rs-panel">

          {/* Presets */}
          <div className="rs-row">
            <span className="rs-label mono">Presets</span>
            <div className="rs-pills">
              {PRESETS.map(p => (
                <button key={p.label} className="btn btn-ghost rs-pill-btn" onClick={() => setS(p.v)}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div className="rs-row">
            <span className="rs-label mono">Frequency</span>
            <div className="rs-pills">
              {["daily","weekly","monthly"].map(f => (
                <button
                  key={f}
                  className={"rs-freq-btn" + (s.frequency === f ? " active" : "")}
                  onClick={() => apply({ frequency: f })}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Day of week (weekly) */}
          {s.frequency === "weekly" && (
            <div className="rs-row">
              <span className="rs-label mono">Day</span>
              <div className="rs-pills">
                {DAY_NAMES.map((d, i) => (
                  <button
                    key={i}
                    className={"rs-freq-btn" + (s.dayOfWeek === i ? " active" : "")}
                    onClick={() => apply({ dayOfWeek: i })}
                  >
                    {d.slice(0,3)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Day of month (monthly) */}
          {s.frequency === "monthly" && (
            <div className="rs-row">
              <span className="rs-label mono">Day of month</span>
              <select
                className="rs-select"
                value={s.dayOfMonth}
                onChange={e => apply({ dayOfMonth: Number(e.target.value) })}
              >
                {Array.from({ length: 28 }, function(_, i) { return i + 1; }).map(function(d) {
                  var suf = d===1?"st":d===2?"nd":d===3?"rd":"th";
                  return <option key={d} value={d}>{d}{suf}</option>;
                })}
              </select>
            </div>
          )}

          {/* Time */}
          <div className="rs-row">
            <span className="rs-label mono">Time</span>
            <div className="rs-time-row">
              <select
                className="rs-select rs-select-hour"
                value={s.hour}
                onChange={e => apply({ hour: Number(e.target.value) })}
              >
                {Array.from({ length: 24 }, function(_, i) { return i; }).map(function(h) {
                  return <option key={h} value={h}>{String(h).padStart(2,"0")}:00</option>;
                })}
              </select>
              <span className="rs-time-colon mono">:</span>
              <select
                className="rs-select"
                value={s.minute}
                onChange={e => apply({ minute: Number(e.target.value) })}
              >
                {[0,15,30,45].map(m => (
                  <option key={m} value={m}>{String(m).padStart(2,"0")}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Live cron preview */}
          <div className="rs-preview">
            <code>{cron}</code>
            <span className="rs-preview-sep">·</span>
            <span className="rs-preview-human">{human}</span>
          </div>

          <div className="rs-save-row">
            <button className="btn btn-clay" onClick={save}>Save schedule →</button>
            <span className="mono" style={{ color:"var(--ink-4)", fontSize:11 }}>
              Updates are saved here — copy the cron into your .md file to activate.
            </span>
          </div>
        </div>
      )}

      {saved && (
        <div className="rs-saved mono">
          ✓ Schedule saved — copy <code>{cron}</code> into the <code>schedule:</code> field of your command file.
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Dashboard modal
// ─────────────────────────────────────────────────────────────────────────────

// Remap Supabase snake_case row → camelCase shape used throughout the UI
function remapRow(f) {
  if (!f.lesson_id) return f; // already camelCase (localStorage row)
  return {
    ...f,
    lessonId:    f.lesson_id,
    lessonTitle: f.lesson_title,
    created_at:  f.created_at,
    timestamp:   f.created_at,
  };
}

function AdminDashboard({ onClose }) {
  const [feedback,   setFeedback]   = useState([]);
  const [syntheses,  setSyntheses]  = useState([]);
  const [proposals,  setProposals]  = useState([]);
  const [view,       setView]       = useState("overview");
  const [synthBusy,  setSynthBusy]  = useState(false);
  const [synthError, setSynthError] = useState("");
  const [lessonFilter, setLessonFilter] = useState("all");
  const [applyBusy,  setApplyBusy]  = useState(null); // proposalId being applied

  // Load live data on mount — feedback via service-role API, proposals/syntheses via anon client
  useEffect(() => {
    const supabaseQueries = window.__supabase
      ? Promise.all([
          window.__supabase.from("hitl_proposals").select("*").order("created_at", { ascending: false }),
          window.__supabase.from("syntheses").select("*").order("created_at", { ascending: false }),
        ])
      : Promise.resolve([{ data: null }, { data: null }]);

    Promise.all([
      fetch("/api/feedback").then(r => r.json()),
      supabaseQueries,
    ]).then(([fbJson, [propRes, synthRes]]) => {
      if (fbJson.feedback && fbJson.feedback.length > 0) setFeedback(fbJson.feedback.map(remapRow));
      if (propRes?.data)  setProposals(propRes.data);
      if (synthRes?.data) setSyntheses(synthRes.data);
    }).catch(() => {});
  }, []);

  // Routine schedule — kept in sync with RoutineScheduler via callback
  const [routineCron,  setRoutineCron]  = useState("0 9 * * MON");
  const [routineHuman, setRoutineHuman] = useState("Every Monday at 09:00");

  const unseen = feedback.filter(f => !f.synthesized);

  // Build allCards from Supabase proposals (primary) falling back to embedded syntheses.proposals
  const allCards = proposals.length > 0
    ? proposals.map(p => ({ ...p, _synthId: p.synthesis_id, _synthDate: p.created_at }))
    : syntheses.flatMap(s =>
        (s.proposals || []).map(p => ({ ...p, _synthId: s.id, _synthDate: s.timestamp }))
      );

  const pendingCount = allCards.filter(c => c.status === "pending").length;
  const latestSynth  = syntheses[syntheses.length - 1];

  // Lesson → title map built from feedback
  const lessonMap = {};
  feedback.forEach(f => { lessonMap[f.lessonId] = f.lessonTitle; });

  // Group feedback by lesson
  const byLesson = {};
  feedback.forEach(f => {
    if (!byLesson[f.lessonId]) byLesson[f.lessonId] = [];
    byLesson[f.lessonId].push(f);
  });

  const avgRating = items => {
    const rated = items.filter(f => f.rating);
    if (!rated.length) return null;
    return (rated.reduce((s, f) => s + f.rating, 0) / rated.length).toFixed(1);
  };

  // ── Synthesis ──────────────────────────────────────────────────────────────
  const runSynthesis = async () => {
    if (!unseen.length) return;
    setSynthBusy(true);
    setSynthError("");
    try {
      // If Supabase is wired up, delegate to the serverless function which uses the Claude API
      if (window.__supabase) {
        const res = await fetch("/api/synthesize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trigger: "manual" }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Synthesis API failed");
        if (json.skipped) {
          setSynthError("Nothing new to synthesize.");
          return;
        }
        // Reload proposals and feedback from Supabase
        const [fbRes, propRes, synthRes] = await Promise.all([
          window.__supabase.from("feedback").select("*").order("created_at", { ascending: false }),
          window.__supabase.from("hitl_proposals").select("*").order("created_at", { ascending: false }),
          window.__supabase.from("syntheses").select("*").order("created_at", { ascending: false }),
        ]);
        if (fbRes.data)   setFeedback(fbRes.data.map(remapRow));
        if (propRes.data) setProposals(propRes.data);
        if (synthRes.data) setSyntheses(synthRes.data);
        setView("hitl");
        return;
      }

      // Fallback: local synthesis via window.claude.complete (offline / no Supabase)
      const payload = unseen.map(f => ({
        lesson: `${f.lessonId}: ${f.lessonTitle}`,
        type: f.type,
        rating: f.rating,
        comment: f.content,
        date: (f.timestamp || f.created_at || "").slice(0, 10),
      }));

      const prompt =
`You are a course-content analyst for "AI-Native Designer 101" — a 60-minute design upskill course on Claude, AI agents, MCP, and deploy/measure workflows for product designers.

Below is learner feedback collected since the last synthesis (${unseen.length} items):

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

      const reply = await window.claude.complete({ messages: [{ role: "user", content: prompt }] });

      let proposals = [];
      try {
        const m = reply.match(/\[[\s\S]*\]/);
        proposals = m ? JSON.parse(m[0]) : [];
      } catch { proposals = []; }

      const markedFeedback = feedback.map(f =>
        unseen.find(u => u.id === f.id) ? { ...f, synthesized: true } : f
      );
      saveFeedback(markedFeedback);
      setFeedback(markedFeedback);

      const synth = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        feedbackCount: unseen.length,
        proposals: proposals.map(p => ({ ...p, id: crypto.randomUUID(), status: "pending", adminNote: "" })),
      };
      const nextSyntheses = [...syntheses, synth];
      saveSyntheses(nextSyntheses);
      setSyntheses(nextSyntheses);
      setView("hitl");
    } catch (e) {
      setSynthError("Synthesis failed — " + (e.message || "check that /api/synthesize is reachable or window.claude.complete is available."));
    } finally {
      setSynthBusy(false);
    }
  };

  // ── Proposal actions ───────────────────────────────────────────────────────
  const updateProposal = (synthId, proposalId, status, adminNote) => {
    // Write to Supabase if available
    if (window.__supabase) {
      window.__supabase.from("hitl_proposals")
        .update({ status, admin_note: adminNote, reviewed_at: new Date().toISOString() })
        .eq("id", proposalId)
        .then(() => {
          setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status, admin_note: adminNote } : p));
        });
    }
    // Always update localStorage-backed syntheses as fallback
    const next = syntheses.map(s => {
      if (s.id !== synthId) return s;
      return {
        ...s,
        proposals: (s.proposals || []).map(p =>
          p.id === proposalId ? { ...p, status, adminNote } : p
        ),
      };
    });
    saveSyntheses(next);
    setSyntheses(next);
    // Also reflect in proposals list (for Supabase-sourced cards)
    setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status, admin_note: adminNote } : p));
  };

  const applyProposal = async (proposalId) => {
    setApplyBusy(proposalId);
    try {
      const res  = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Apply failed");
      setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status: "applied", pr_url: json.prUrl } : p));
    } catch (e) {
      alert("Auto-apply failed: " + e.message);
    } finally {
      setApplyBusy(null);
    }
  };

  // ── Filtered list for feedback view ───────────────────────────────────────
  const filteredFeedback = feedback
    .filter(f => lessonFilter === "all" || String(f.lessonId) === String(lessonFilter))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal admin-modal">

        {/* ── Modal header ── */}
        <div className="modal-head">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h4 style={{ margin: 0, fontFamily: "var(--serif)", fontWeight: 400 }}>Learning Loop</h4>
              <span className="chip dot" style={{ fontSize: 10 }}>Admin</span>
            </div>
            <div className="mono" style={{ color: "var(--ink-3)", marginTop: 4, fontSize: 11 }}>
              {feedback.length} total · {unseen.length} unsynthesized · {pendingCount} HITL pending
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {["overview", "feedback", "hitl", "automations"].map(v => (
              <button
                key={v}
                className={"btn btn-ghost admin-nav-btn" + (view === v ? " admin-nav-active" : "")}
                onClick={() => setView(v)}
              >
                {v === "hitl" ? <>HITL {pendingCount > 0 && <span className="admin-badge">{pendingCount}</span>}</> : v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
            <button className="btn btn-ghost" onClick={onClose} style={{ marginLeft: 4 }}>✕</button>
          </div>
        </div>

        <div className="modal-body">

          {/* ══ OVERVIEW ══════════════════════════════════════════════════════ */}
          {view === "overview" && (
            <div>
              {/* Stat row */}
              <div className="admin-stats">
                {[
                  { n: feedback.length,    label: "Total responses" },
                  { n: unseen.length,      label: "Awaiting synthesis" },
                  { n: syntheses.length,   label: "Syntheses run" },
                  { n: pendingCount,       label: "HITL pending" },
                ].map(({ n, label }) => (
                  <div key={label} className="admin-stat">
                    <div className="admin-stat-n">{n}</div>
                    <div className="admin-stat-label mono">{label}</div>
                  </div>
                ))}
              </div>

              {/* Synthesis trigger */}
              <div className="admin-section-hd mono">Synthesis</div>
              <div className="synth-card">
                <div className="synth-card-text">
                  <strong>Run synthesis with Claude</strong>
                  <p>
                    Claude analyses all unsynthesized feedback and produces HITL improvement proposals ranked by severity — trivial (safe to apply) through major (plan first).
                  </p>
                  {latestSynth && (
                    <p className="mono" style={{ color: "var(--ink-3)", margin: "4px 0 0", fontSize: 11 }}>
                      Last run: {new Date(latestSynth.timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      {" · "}{latestSynth.feedbackCount} items · {latestSynth.proposals?.length || 0} proposals
                    </p>
                  )}
                </div>
                <div className="synth-card-action">
                  <button
                    className="btn btn-clay"
                    onClick={runSynthesis}
                    disabled={synthBusy || unseen.length < 1}
                  >
                    {synthBusy
                      ? "Synthesizing…"
                      : unseen.length > 0
                        ? `Synthesize ${unseen.length} response${unseen.length !== 1 ? "s" : ""} →`
                        : "Nothing new to synthesize"
                    }
                  </button>
                  {unseen.length === 0 && (
                    <span className="mono" style={{ color: "var(--ink-4)", fontSize: 11, marginTop: 6, display: "block", textAlign: "center" }}>
                      All feedback already synthesized
                    </span>
                  )}
                </div>
              </div>
              {synthError && (
                <div className="callout warn" style={{ marginTop: 12 }}>
                  <div className="callout-icon">!</div>
                  <div>{synthError}</div>
                </div>
              )}

              {/* Per-lesson breakdown */}
              {Object.keys(byLesson).length > 0 && (
                <>
                  <div className="admin-section-hd mono" style={{ marginTop: 28 }}>Feedback by lesson</div>
                  <div className="lesson-fb-list">
                    {Object.entries(byLesson)
                      .sort((a, b) => Number(a[0]) - Number(b[0]))
                      .map(([lid, items]) => {
                        const avg = avgRating(items);
                        return (
                          <div
                            key={lid}
                            className="lesson-fb-row"
                            onClick={() => { setLessonFilter(lid); setView("feedback"); }}
                          >
                            <div className="lesson-fb-info">
                              <span className="mono" style={{ color: "var(--ink-3)" }}>
                                L{String(lid).padStart(2, "0")}
                              </span>
                              <span className="lesson-fb-name">{items[0]?.lessonTitle}</span>
                            </div>
                            <div className="lesson-fb-right">
                              {avg && <span style={{ color: "var(--clay)" }}>★ {avg}</span>}
                              <span className="mono" style={{ color: "var(--ink-3)" }}>
                                {items.length} response{items.length !== 1 ? "s" : ""} →
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </>
              )}

              {feedback.length === 0 && (
                <div className="admin-empty">
                  No feedback yet. Responses appear here as learners complete and rate lessons.
                </div>
              )}
            </div>
          )}

          {/* ══ FEEDBACK LIST ═════════════════════════════════════════════════ */}
          {view === "feedback" && (
            <div>
              <div className="admin-filter-row">
                <span className="mono" style={{ color: "var(--ink-3)" }}>Filter:</span>
                {[{ id: "all", label: "All" }, ...Object.keys(byLesson).sort((a, b) => Number(a) - Number(b)).map(id => ({ id, label: `L${id}` }))].map(opt => (
                  <button
                    key={opt.id}
                    className={"btn btn-ghost" + (lessonFilter === opt.id ? " admin-nav-active" : "")}
                    onClick={() => setLessonFilter(opt.id)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {filteredFeedback.map(f => (
                <div key={f.id} className={"fb-item" + (f.synthesized ? " fb-synthesized" : "")}>
                  <div className="fb-item-head">
                    <span className="mono" style={{ color: "var(--ink-3)" }}>
                      L{String(f.lessonId).padStart(2, "0")} · {f.lessonTitle}
                    </span>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      {f.rating && (
                        <span style={{ color: "var(--clay)", fontSize: 13, letterSpacing: 1 }}>
                          {"★".repeat(f.rating)}{"☆".repeat(5 - f.rating)}
                        </span>
                      )}
                      <span className="mono" style={{ color: "var(--ink-4)", fontSize: 11 }}>
                        {new Date(f.timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                      {f.synthesized && (
                        <span className="chip moss dot" style={{ fontSize: 10, padding: "2px 7px" }}>Synthesized</span>
                      )}
                    </div>
                  </div>
                  <div className="fb-item-body">
                    {f.content
                      ? f.content
                      : <em style={{ color: "var(--ink-4)" }}>No comment left</em>
                    }
                  </div>
                </div>
              ))}

              {filteredFeedback.length === 0 && (
                <div className="admin-empty" style={{ padding: "20px 0" }}>
                  No feedback for this lesson yet.
                </div>
              )}
            </div>
          )}

          {/* ══ HITL CARDS ════════════════════════════════════════════════════ */}
          {view === "hitl" && (
            <div>
              {allCards.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                  <div className="mono" style={{ color: "var(--ink-4)", fontSize: 14 }}>No proposals yet.</div>
                  <p style={{ color: "var(--ink-3)", maxWidth: 400, margin: "12px auto 0" }}>
                    Run a synthesis from the Overview tab to generate improvement proposals from learner feedback.
                  </p>
                  <button className="btn btn-clay" style={{ marginTop: 20 }} onClick={() => setView("overview")}>
                    Go to Overview →
                  </button>
                </div>
              ) : (
                <>
                  {/* Severity legend */}
                  <div className="hitl-legend">
                    {Object.entries(SEV).map(([k, v]) => (
                      <div key={k} className="hitl-legend-item">
                        <span className="sev-badge" style={{ background: v.bg, color: v.color, borderColor: v.border }}>
                          {v.label}
                        </span>
                        <span className="mono" style={{ color: "var(--ink-3)", fontSize: 11 }}>{v.desc}</span>
                      </div>
                    ))}
                  </div>

                  {/* Cards grouped by severity */}
                  {["trivial", "minor", "major"].map(sev => {
                    const group = allCards.filter(c => c.severity === sev);
                    if (!group.length) return null;
                    return (
                      <div key={sev} style={{ marginBottom: 28 }}>
                        <div className="admin-section-hd mono" style={{ marginBottom: 10 }}>
                          {SEV[sev].label} · {group.length} proposal{group.length !== 1 ? "s" : ""}
                        </div>
                        {group.map(card => (
                          <HITLCard
                            key={card.id}
                            proposal={card}
                            onApprove={note => updateProposal(card._synthId, card.id, "approved", note)}
                            onDismiss={note => updateProposal(card._synthId, card.id, "dismissed", note)}
                            onApplyAuto={window.__supabase ? () => applyProposal(card.id) : null}
                            applyBusy={applyBusy === card.id}
                          />
                        ))}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}

          {/* ══ AUTOMATIONS ═══════════════════════════════════════════════════ */}
          {view === "automations" && (
            <div>
              <div className="callout do" style={{ marginBottom: 24 }}>
                <div className="callout-icon">→</div>
                <div>
                  <strong>Automated learning loop — always on</strong>
                  <p style={{ margin: "4px 0 0" }}>
                    Feedback is written directly to Supabase. A Vercel Cron job synthesises it every Monday at 9am via the Claude API. When you approve a trivial proposal in the HITL tab, one click opens a GitHub PR — review the Vercel preview and merge to ship the fix.
                  </p>
                </div>
              </div>

              {/* Pipeline status card */}
              <div className="admin-section-hd mono">Pipeline status</div>
              <div className="routine-card">
                <div className="routine-card-meta">
                  <span className="chip dot" style={{ fontSize: 10 }}>{window.__supabase ? "live" : "localStorage fallback"}</span>
                  <span className="mono" style={{ color: "var(--ink-3)", fontSize: 11 }}>
                    {window.__supabase ? "Supabase + Vercel Cron + Claude API" : "Configure SUPABASE_URL in app.jsx to activate"}
                  </span>
                </div>
                <div className="routine-card-body">
                  <div className="routine-stat-row">
                    <div className="routine-stat">
                      <div className="routine-stat-n">{feedback.length}</div>
                      <div className="routine-stat-label">total responses</div>
                    </div>
                    <div className="routine-stat">
                      <div className="routine-stat-n">{unseen.length}</div>
                      <div className="routine-stat-label">awaiting synthesis</div>
                    </div>
                    <div className="routine-stat">
                      <div className="routine-stat-n">{syntheses.length}</div>
                      <div className="routine-stat-label">syntheses run</div>
                    </div>
                    <div className="routine-stat">
                      <div className="routine-stat-n">{pendingCount}</div>
                      <div className="routine-stat-label">proposals pending</div>
                    </div>
                  </div>
                  {latestSynth && (
                    <p className="mono" style={{ fontSize:11, color:"var(--ink-4)", margin:"10px 0 0" }}>
                      Last synthesis: {new Date(latestSynth.timestamp || latestSynth.created_at).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })}
                      {" · "}{latestSynth.feedbackCount || latestSynth.feedback_count} items
                    </p>
                  )}
                  <div style={{ marginTop: 16 }}>
                    <button
                      className="btn btn-clay"
                      onClick={runSynthesis}
                      disabled={synthBusy || unseen.length < 1}
                    >
                      {synthBusy ? "Synthesizing…" : unseen.length > 0 ? `Run synthesis now →` : "Nothing new to synthesize"}
                    </button>
                  </div>
                  {synthError && (
                    <p className="mono" style={{ color: "var(--clay)", fontSize: 12, marginTop: 8 }}>{synthError}</p>
                  )}
                </div>
              </div>

              {/* Vercel Cron config */}
              <div className="admin-section-hd mono" style={{ marginTop: 28 }}>Cron schedule · vercel.json</div>
              <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 12 }}>
                The weekly synthesis runs automatically via Vercel Cron. Edit <code>vercel.json</code> at the repo root to change the schedule.
              </p>
              <div className="code">
                <div className="code-head">
                  <span><span className="dots"><i></i><i></i><i></i></span></span>
                  <span style={{ marginLeft: "auto" }}>vercel.json</span>
                </div>
                <div className="code-body">
                  <pre style={{ margin: 0, whiteSpace: "pre", fontSize: "12px", lineHeight: 1.65, color: "var(--code-ink)" }}>{[
`{`,
`  "crons": [`,
`    {`,
`      "path": "/api/synthesize",`,
`      "schedule": "0 9 * * MON"`,
`    }`,
`  ]`,
`}`,
].join("\n")}</pre>
                </div>
              </div>

              {/* Export fallback */}
              <div className="admin-section-hd mono" style={{ marginTop: 28 }}>Data portability — export backup</div>
              <div className="export-card">
                <div className="export-card-text">
                  <strong>Export feedback.json</strong>
                  <p>
                    Download a full backup of all feedback and syntheses from this browser's localStorage. Useful if Supabase isn't configured yet or as an offline copy.
                  </p>
                </div>
                <button className="btn btn-clay" onClick={exportFeedbackJSON} disabled={feedback.length === 0}>
                  Export feedback.json →
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Feedback nudge — shown in sidebar after enough unsynthesized responses pile up
// ─────────────────────────────────────────────────────────────────────────────

function FeedbackNudge({ count, onOpenAdmin }) {
  if (count < 3) return null;
  return (
    <div className="fb-nudge" onClick={onOpenAdmin}>
      <span className="fb-nudge-dot" />
      <span className="mono" style={{ fontSize: 11 }}>
        {count} new response{count !== 1 ? "s" : ""} — run synthesis
      </span>
      <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--clay)" }}>→</span>
    </div>
  );
}

Object.assign(window, { FeedbackPanel, AdminDashboard, AdminGate, FeedbackNudge, loadFeedback, exportFeedbackJSON, ADMIN_SESSION });
