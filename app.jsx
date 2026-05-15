// Main app shell — sidebar, progress, navigation, modals, learning loop

// ── Supabase client (anon key is safe to expose; RLS enforces access)
// Replace these with your project values after creating the Supabase project.
const SUPABASE_URL      = "https://bcbjufeltrrvzclkykzi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYmp1ZmVsdHJydnpjbGt5a3ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NzYxOTksImV4cCI6MjA5NDI1MjE5OX0.30xytS_gDiHiDPaGs-OgPOQdtc76SDtA1HdpHCCqzdA";

if (
  typeof window.supabase !== "undefined" &&
  SUPABASE_URL !== "https://YOUR_PROJECT.supabase.co"
) {
  window.__supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

const LESSONS = [
  { group: "Intro", items: [
    { id: 1,  title: "The future of designers", Comp: ({ onNavigate }) => <Lesson1 onNavigate={onNavigate} /> },
  ]},
  { group: "Tools", items: [
    { id: 2,  title: "Claude Desktop", Comp: () => <Lesson2 /> },
    { id: 3,  title: "Claude Code", Comp: () => <Lesson3 /> },
    { id: 4,  title: "Skills", Comp: () => <Lesson4 /> },
  ]},
  { group: "Foundations", items: [
    { id: 5,  title: "Agents — what Anthropic means", Comp: () => <Lesson5 /> },
    { id: 6,  title: "Sub-agents & orchestrators", Comp: () => <Lesson6 /> },
    { id: 7,  title: "Autonomous agents", Comp: () => <Lesson7 /> },
    { id: 15, title: "Context & cost", Comp: () => <Lesson15 /> },
  ]},
  { group: "Wiring", items: [
    { id: 8,  title: "MCP — the protocol", Comp: () => <Lesson8 /> },
    { id: 9,  title: "Figma MCP & Console MCP", Comp: () => <Lesson9 /> },
    { id: 10, title: ".md / .mdx / .yaml / schema", Comp: () => <Lesson10 /> },
  ]},
  { group: "Ship & measure", items: [
    { id: 11, title: "Deploy to GitHub & Vercel", Comp: () => <Lesson11 /> },
    { id: 12, title: "Measure with PostHog · Clarity · Hotjar", Comp: () => <Lesson12 /> },
    { id: 13, title: "Wrap-up", Comp: () => <Lesson13 /> },
  ]},
  { group: "Meta", items: [
    { id: 14, title: "The course that teaches itself", Comp: () => <Lesson14 /> },
  ]},
];

const FLAT = LESSONS.flatMap(g => g.items);
const STORAGE_KEY = "ai-native-designer-101::v2";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { current: 1, completed: [] };
}
function saveState(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) {}
}

function App() {
  const [state,       setState]       = useState(loadState);
  const [openGloss,   setOpenGloss]   = useState(false);
  const [openAsk,     setOpenAsk]     = useState(false);
  const [openAdmin,   setOpenAdmin]   = useState(false);
  const [openGate,    setOpenGate]    = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mainRef   = useRef(null);

  // Secret admin access: click brand logo 5× within 2 s
  const adminTaps  = useRef(0);
  const adminTimer = useRef(null);

  // Unsynthesized feedback count for sidebar nudge
  const [unseenCount, setUnseenCount] = useState(
    () => window.loadFeedback ? window.loadFeedback().filter(f => !f.synthesized).length : 0
  );

  // Refresh unseen count whenever admin closes (synthesis may have run)
  useEffect(() => {
    if (!openAdmin && window.loadFeedback) {
      setUnseenCount(window.loadFeedback().filter(f => !f.synthesized).length);
    }
  }, [openAdmin]);

  const handleBrandClick = () => {
    adminTaps.current += 1;
    if (adminTaps.current >= 5) {
      adminTaps.current = 0;
      clearTimeout(adminTimer.current);
      // Skip gate if already authenticated this session
      if (window.ADMIN_SESSION && sessionStorage.getItem(window.ADMIN_SESSION) === "1") {
        setOpenAdmin(true);
      } else {
        setOpenGate(true);
      }
      return;
    }
    clearTimeout(adminTimer.current);
    adminTimer.current = setTimeout(() => { adminTaps.current = 0; }, 2000);
  };

  const currentIdx = FLAT.findIndex(l => l.id === state.current);
  const current    = FLAT[currentIdx] || FLAT[0];
  const Comp       = current.Comp;
  const completed  = state.completed || [];
  const pct        = Math.round((completed.length / FLAT.length) * 100);

  useEffect(() => { saveState(state); }, [state]);
  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTo({ top: 0, behavior: "auto" });
  }, [state.current]);

  const goTo = (id) => {
    setState(s => ({
      ...s,
      current: id,
      completed: s.completed.includes(s.current) ? s.completed : [...s.completed, s.current],
    }));
    setSidebarOpen(false);
  };

  const next = FLAT[currentIdx + 1];
  const prev = FLAT[currentIdx - 1];

  return (
    <>
      <div className="app">

        {/* ── Sidebar overlay (mobile) ────────────────────────────────────── */}
        {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <aside className={"sidebar" + (sidebarOpen ? " open" : "")}>
          <div
            className="brand"
            style={{ cursor: "default", userSelect: "none" }}
            onClick={handleBrandClick}
            title="Course admin (click 5× to open)"
          >
            <div className="brand-mark">
              <div className="brand-logo">A</div>
              <div>
                <div className="brand-title">AI-Native Designer 101</div>
                <div className="brand-sub">A living course that teaches itself</div>
              </div>
            </div>
          </div>

          <div className="progress-block">
            <div className="progress-row">
              <span className="mono">PROGRESS</span>
              <span className="mono">{completed.length} / {FLAT.length} · {pct}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: pct + "%" }} />
            </div>
          </div>

          <div className="lessons-list">
            {LESSONS.map((group, gi) => (
              <div key={gi}>
                <div className="lesson-group-label">{group.group}</div>
                {group.items.map((l) => {
                  const done   = completed.includes(l.id);
                  const active = l.id === state.current;
                  return (
                    <div
                      key={l.id}
                      className={"lesson-item" + (active ? " active" : "") + (done ? " done" : "")}
                      onClick={() => goTo(l.id)}
                    >
                      <span className="lesson-node"></span>
                      <span className="lesson-title">{l.title}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Synthesis nudge — visible when ≥ 3 unsynthesized responses exist */}
          <FeedbackNudge count={unseenCount} onOpenAdmin={() => setOpenAdmin(true)} />

          <div className="sidebar-foot">
            <button className="btn" onClick={() => setOpenGloss(true)}>Glossary</button>
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <main className="main" ref={mainRef}>
          <div className="main-header">
            <div className="crumbs">
              <button
                className="btn btn-ghost sidebar-toggle"
                aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
                onClick={() => setSidebarOpen(s => !s)}
              >
                {sidebarOpen
                  ? <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="6" height="16" rx="2" fill="currentColor" opacity=".25"/><path d="M14 5l-4 4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="6" height="16" rx="2" stroke="currentColor" strokeWidth="1.4"/><rect x="9" y="4" width="8" height="1.4" rx=".7" fill="currentColor"/><rect x="9" y="8.3" width="8" height="1.4" rx=".7" fill="currentColor"/><rect x="9" y="12.6" width="8" height="1.4" rx=".7" fill="currentColor"/></svg>
                }
              </button>
              <strong>{current.title}</strong>
            </div>
            <div className="header-actions">
              <button className="btn btn-ghost" onClick={() => setOpenGloss(true)}>Glossary</button>
            </div>
          </div>

          {/* Lesson content */}
          <div className="lesson" key={current.id}>
            <Comp onNavigate={goTo} />
          </div>

          {/* ── Per-lesson feedback panel ── */}
          <div className="fp-outer">
            <FeedbackPanel
              key={current.id}
              lessonId={current.id}
              lessonTitle={current.title}
            />
          </div>

          {/* Prev / Next pager */}
          <div className="pager">
            {prev ? (
              <div className="pager-card" onClick={() => goTo(prev.id)}>
                <span className="mono">← PREVIOUS</span>
                <div className="title">{prev.title}</div>
              </div>
            ) : <div />}
            {next ? (
              <div className="pager-card next" onClick={() => goTo(next.id)}>
                <span className="mono">NEXT →</span>
                <div className="title">{next.title}</div>
              </div>
            ) : (
              <div className="pager-card next">
                <span className="mono">FINISH ✓</span>
                <div className="title">You've completed the course — well done.</div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Floating Ask button */}
      <button
        className="fab"
        onClick={() => setOpenAsk(o => !o)}
        aria-label={openAsk ? "Close Ask panel" : "Ask a question"}
        title="Ask a question"
      >
        {openAsk
          ? <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          : <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2C5.58 2 2 5.13 2 9c0 2.08.95 3.95 2.48 5.27L4 17l3.18-1.27C8.02 16.23 8.99 16.4 10 16.4c4.42 0 8-3.13 8-7s-3.58-7-8-7z" fill="currentColor" opacity=".9"/><circle cx="7" cy="9" r="1.1" fill="white"/><circle cx="10" cy="9" r="1.1" fill="white"/><circle cx="13" cy="9" r="1.1" fill="white"/></svg>
        }
      </button>

      <AskDrawer
        open={openAsk}
        onClose={() => setOpenAsk(false)}
        lessonId={current.id}
        lessonTitle={current.title}
      />

      {openGloss && <GlossaryModal   onClose={() => setOpenGloss(false)} />}
      {openGate  && <AdminGate onUnlock={() => { setOpenGate(false); setOpenAdmin(true); }} onCancel={() => setOpenGate(false)} />}
      {openAdmin && <AdminDashboard  onClose={() => setOpenAdmin(false)} />}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
