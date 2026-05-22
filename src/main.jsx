import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import {
  Bell, BookOpen, ChartNoAxesCombined, Check, ChevronRight,
  CircleUserRound, ClipboardList, Eye, EyeOff, Filter, Heart, Home,
  LayoutDashboard, MessageCircle, MoreHorizontal, PenLine, Plus,
  Search, Send, ShieldCheck, Sparkles, Star, Tags, TrendingUp,
  UserRoundPlus, UsersRound, Zap, Loader2, AlertTriangle, RefreshCw, X, LogOut
} from "lucide-react";
import {
  HashRouter, Link, Navigate, NavLink, Outlet, Route, Routes,
  useLocation, useNavigate, useParams, useSearchParams
} from "react-router-dom";
import {
  authAPI, usersAPI, postsAPI, matchesAPI, notificationsAPI, messagesAPI, adminAPI, skillsAPI
} from "./lib/api.js";
import "./styles.css";

/* ═══════════════════════════════════════════════════════════════
   AUTH CONTEXT
   ═══════════════════════════════════════════════════════════════ */
const AuthCtx = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("peerlift_token");
    if (!token) { setLoading(false); return; }
    authAPI.me()
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem("peerlift_token");
        localStorage.removeItem("peerlift_user");
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password });
    localStorage.setItem("peerlift_token", res.data.access_token);
    localStorage.setItem("peerlift_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const signup = useCallback(async (body) => {
    const res = await authAPI.register(body);
    localStorage.setItem("peerlift_token", res.data.access_token);
    localStorage.setItem("peerlift_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch {}
    localStorage.removeItem("peerlift_token");
    localStorage.removeItem("peerlift_user");
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await authAPI.me();
      setUser(res.data);
    } catch {}
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, signup, logout, refreshUser, isAuthenticated: !!user }),
    [user, loading, login, signup, logout, refreshUser]
  );
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

function useAuth() { return useContext(AuthCtx); }

/* ═══════════════════════════════════════════════════════════════
   DATA FETCHING HOOK
   ═══════════════════════════════════════════════════════════════ */
function useAPI(fetchFn, deps = []) {
  const [data, setData] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFn();
      setData(res.data);
      if (res.pagination) setPagination(res.pagination);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => { load(); }, [load]);
  return { data, pagination, loading, error, reload: load, setData };
}

/* ═══════════════════════════════════════════════════════════════
   PROTECTED ROUTE
   ═══════════════════════════════════════════════════════════════ */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingPage />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children || <Outlet />;
}

/* ═══════════════════════════════════════════════════════════════
   APP
   ═══════════════════════════════════════════════════════════════ */
function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/signup" element={<Auth mode="signup" />} />
          <Route element={<ProtectedRoute><StudentShell /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/queue" element={<Queue />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:userId" element={<UserProfile />} />
            <Route path="/edit-profile" element={<EditProfile />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/chat" element={<Chat />} />
          </Route>
          <Route element={<ProtectedRoute><AdminShell /></ProtectedRoute>}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/posts" element={<PostModeration />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════════════════ */
function Brand() {
  const auth = useAuth();
  const dest = auth?.isAuthenticated ? "/dashboard" : "/";
  return (
    <Link className="brand" to={dest}>
      <span className="brand-mark"><Sparkles size={20} /></span>
      <span>PeerLift</span>
    </Link>
  );
}

function LoadingPage() {
  return <div className="loading-page"><Loader2 className="spin" size={32} /><p>Loading...</p></div>;
}

function LoadingSpinner() {
  return <div className="loading-spinner"><Loader2 className="spin" size={24} /></div>;
}

function ErrorBlock({ message, onRetry }) {
  return (
    <div className="error-block">
      <AlertTriangle size={22} />
      <p>{message || "Something went wrong."}</p>
      {onRetry && <button className="secondary-button" onClick={onRetry}><RefreshCw size={16} /> Retry</button>}
    </div>
  );
}

function EmptyBlock({ icon: Icon, title, message, action }) {
  return (
    <section className="empty-state">
      {Icon && <Icon size={28} />}
      <h3>{title || "Nothing here yet"}</h3>
      <p>{message}</p>
      {action}
    </section>
  );
}

function Stat({ value, label }) {
  return <div><strong>{value}</strong><span>{label}</span></div>;
}

function Metric({ icon: Icon, value, label }) {
  return <article className="metric-card"><Icon size={22} /><strong>{value}</strong><span>{label}</span></article>;
}

function Panel({ title, action, onAction, children, wide }) {
  return (
    <section className={`panel ${wide ? "wide" : ""}`}>
      <header>
        <h2>{title}</h2>
        {action && <button onClick={onAction}>{action}</button>}
      </header>
      {children}
    </section>
  );
}

function MiniPerson({ person }) {
  return (
    <div className="mini-person">
      <InitialAvatar name={person.name} />
      <div>
        <strong>{person.name}</strong>
        <span>{person.skills_teaching?.slice(0, 2).map(s => s.skill_name).join(" · ") || person.college || ""}</span>
      </div>
    </div>
  );
}

function Notice({ title, body, status }) {
  return (
    <article className={`notice ${status === "Unread" || !status ? "unread" : ""}`}>
      <Bell size={18} />
      <div><strong>{title}</strong><p>{body}</p></div>
      <span>{status}</span>
    </article>
  );
}

function Quick({ to, icon: Icon, label }) {
  return <Link className="quick-action" to={to}><Icon size={20} /><span>{label}</span></Link>;
}

function InitialAvatar({ name, className = "" }) {
  const initials = (name || "?")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return <span className={`initial-avatar ${className}`}>{initials}</span>;
}

function InfoPanel({ title, rows }) {
  return <Panel title={title}>{rows.map((row) => <p className="info-row" key={row}>{row}</p>)}</Panel>;
}

function BarChartFromData({ data }) {
  if (!data || data.length === 0) return <p>No data available.</p>;
  const max = Math.max(...data.map(d => d.count || d.usage_count || 0), 1);
  return (
    <div className="bar-chart">
      {data.map(({ name, count, usage_count }) => {
        const val = count ?? usage_count ?? 0;
        const pct = Math.round((val / max) * 100);
        return (
          <div key={name}>
            <span>{name}</span>
            <i style={{ width: `${pct}%` }} />
            <strong>{val}</strong>
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, ...props }) {
  return <div className="field"><label>{label}</label><input {...props} /></div>;
}

function TextArea({ label, ...props }) {
  return <div className="field"><label>{label}</label><textarea {...props} /></div>;
}

function Toast({ message, type, onClose }) {
  if (!message) return null;
  return (
    <div className={`toast toast-${type || "info"}`}>
      <span>{message}</span>
      <button onClick={onClose}><X size={16} /></button>
    </div>
  );
}

function Page({ children }) {
  return <main className="page">{children}</main>;
}

/* ═══════════════════════════════════════════════════════════════
   LANDING
   ═══════════════════════════════════════════════════════════════ */
function Landing() {
  return (
    <main className="landing">
      <nav className="topbar">
        <Brand />
        <div className="topbar-actions">
          <Link to="/login" className="ghost-button">Login</Link>
          <Link to="/signup" className="primary-button">Signup</Link>
        </div>
      </nav>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><Zap size={16} /> Student skill exchange platform</span>
          <h1>PeerLift</h1>
          <p>Trade what you know for what you want to learn. Find students who can mentor, collaborate, review your work, and grow with you.</p>
          <div className="hero-actions">
            <Link to="/signup" className="primary-button big">Get Started <ChevronRight size={18} /></Link>
            <Link to="/login" className="secondary-button big">Login</Link>
          </div>
        </div>
        <div className="hero-visual" aria-label="PeerLift matching dashboard preview">
          <div className="hero-preview">
            <div className="preview-card main">
              <span>Skill exchange</span>
              <strong>React to Python</strong>
              <div className="progress-line"><i /></div>
            </div>
            <div className="preview-card">
              <UsersRound size={22} />
              <strong>18 matches</strong>
              <span>4 ready today</span>
            </div>
            <div className="preview-card">
              <MessageCircle size={22} />
              <strong>Community feed</strong>
              <span>New study circle posted</span>
            </div>
          </div>
          <div className="match-float">
            <span>Best match</span>
            <strong>96%</strong>
            <p>React for Python</p>
          </div>
        </div>
      </section>
      <section className="feature-band">
        {[
          ["Smart matching", "Pair students by teach-skill, learn-skill, level, and availability.", UsersRound],
          ["Community feed", "Share progress, ask questions, and find collaborators.", MessageCircle],
          ["Profiles that matter", "Show skills, projects, links, certifications, and learning goals.", CircleUserRound],
          ["Admin controls", "Moderate reports, users, posts, and platform analytics.", ShieldCheck]
        ].map(([title, body, Icon]) => (
          <article className="feature-card" key={title}><Icon size={24} /><h3>{title}</h3><p>{body}</p></article>
        ))}
      </section>
      <section className="how-grid">
        <div>
          <span className="eyebrow"><Tags size={16} /> How matching works</span>
          <h2>Teach one skill. Learn another. Keep momentum visible.</h2>
        </div>
        {["Create your profile", "Post a skill exchange", "Connect with top matches", "Learn through chat and feed"].map((item, index) => (
          <div className="step-card" key={item}><span>{index + 1}</span><strong>{item}</strong></div>
        ))}
      </section>
      <section className="stats-strip">
        <Stat value="2.8k" label="mock learners" />
        <Stat value="84%" label="match success" />
        <Stat value="120+" label="skills listed" />
        <Stat value="4.9/5" label="student rating" />
      </section>
      <footer className="footer">PeerLift 2026 - Learn together, build better.</footer>
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AUTH PAGE
   ═══════════════════════════════════════════════════════════════ */
function Auth({ mode }) {
  const isSignup = mode === "signup";
  const [show, setShow] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    const fd = new FormData(e.target);
    try {
      if (isSignup) {
        await signup({
          name: fd.get("name"), username: fd.get("username"),
          email: fd.get("email"), password: fd.get("password"), college: fd.get("college"),
        });
      } else {
        await login(fd.get("email"), fd.get("password"));
      }
      navigate("/dashboard");
    } catch (err) {
      setFormError(err.response?.data?.error || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-panel">
        <Brand />
        <h1>{isSignup ? "Create your PeerLift account" : "Welcome back"}</h1>
        <p>{isSignup ? "Build your student profile and start matching today." : "Jump back into your learning exchange hub."}</p>
        <form onSubmit={handleSubmit}>
          {isSignup && (
            <>
              <Field label="Full name" name="name" placeholder="What people call you?" required />
              <Field label="Username" name="username" placeholder="Your nick name" required />
            </>
          )}
          <Field label="Email" name="email" placeholder="you@college.edu" type="email" required />
          <div className="field">
            <label>Password</label>
            <div className="password-wrap">
              <input name="password" type={show ? "text" : "password"} placeholder="Minimum 8 characters" required minLength={8} />
              <button type="button" onClick={() => setShow(!show)} aria-label="Toggle password visibility">
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {isSignup && (
            <Field label="College/University" name="college" placeholder="Your campus name" />
          )}
          {formError && <div className="form-alert" style={{ color: "#b91c1c", background: "#fef2f2" }}>{formError}</div>}
          <button type="submit" className="primary-button full" disabled={submitting}>
            {submitting ? <Loader2 className="spin" size={18} /> : null}
            {isSignup ? "Create Account" : "Login"}
          </button>
        </form>
        <p className="switch-auth">
          {isSignup ? "Already have an account?" : "New to PeerLift?"}{" "}
          <Link to={isSignup ? "/login" : "/signup"}>{isSignup ? "Login" : "Signup"}</Link>
        </p>
      </div>
      <aside className="auth-side">
        <div className="auth-preview">
          <Brand />
          <h2>Find learning partners by skill, level, and availability.</h2>
          <div className="auth-preview-grid">
            <Stat value="96%" label="top match" />
            <Stat value="5" label="pending requests" />
            <Stat value="120+" label="skills" />
          </div>
        </div>
      </aside>
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SHELLS
   ═══════════════════════════════════════════════════════════════ */
const studentNav = [
  ["/dashboard", "Dashboard", Home], ["/learn", "Learn", BookOpen],
  ["/matches", "Matches", UsersRound], ["/queue", "Queue", ClipboardList],
  ["/feed", "Feed", MessageCircle], ["/profile", "Profile", CircleUserRound],
  ["/notifications", "Notifications", Bell], ["/chat", "Chat", Send],
];
const adminNav = [
  ["/admin", "Overview", LayoutDashboard],
  ["/admin/users", "Users", UsersRound],
  ["/admin/posts", "Moderation", ShieldCheck],
];

function StudentShell() { return <Shell nav={studentNav} admin={false} />; }
function AdminShell() { return <Shell nav={adminNav} admin />; }

function Shell({ nav, admin }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <nav>
          {nav.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} className={({ isActive }) => isActive ? "active" : ""}>
              <Icon size={19} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        {user?.is_admin && (
          <Link className="sidebar-cta" to={admin ? "/dashboard" : "/admin"}>
            {admin ? <Home size={18} /> : <ShieldCheck size={18} />}
            <span>{admin ? "Student view" : "Admin view"}</span>
          </Link>
        )}
      </aside>
      <div className="main-area">
        <header className="app-header">
          <div>
            <p>{admin ? "Moderator workspace" : "Student workspace"}</p>
            <h1>{titleFor(location.pathname)}</h1>
          </div>
          <div className="header-actions">
            <div className="search"><Search size={17} /><input placeholder="Search skills, people, posts" /></div>
            <Link to="/notifications" className="icon-button" aria-label="Notifications"><Bell size={19} /></Link>
            <Link to="/profile" className="avatar-btn" title="Profile">
              <InitialAvatar name={user?.name || "User"} className="avatar" />
            </Link>
            <button className="icon-button" onClick={async () => { await logout(); navigate("/"); }} title="Logout">
              <LogOut size={19} />
            </button>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}

function titleFor(path) {
  const titles = {
    "/dashboard": "Dashboard", "/learn": "Create Skill Exchange", "/matches": "Match Results",
    "/queue": "Pending Queue", "/feed": "Community Feed", "/profile": "Profile",
    "/edit-profile": "Edit Profile", "/notifications": "Notifications", "/chat": "Chat",
    "/admin": "Admin Dashboard", "/admin/users": "User Management", "/admin/posts": "Post Moderation",
  };
  return titles[path] || "PeerLift";
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════════════════════════ */
function Dashboard() {
  const { user } = useAuth();
  const { data: stats, loading: sl, error: se, reload: rl } = useAPI(() => usersAPI.myStats(), []);
  const { data: recentMatches, loading: ml } = useAPI(() => matchesAPI.list({ status: "accepted", per_page: 4 }), []);
  const { data: notifs, loading: nl } = useAPI(() => notificationsAPI.list({ per_page: 3 }), []);
  const { data: posts, loading: pl } = useAPI(() => postsAPI.list({ per_page: 2 }), []);

  if (sl) return <Page><LoadingSpinner /></Page>;
  if (se) return <Page><ErrorBlock message={se} onRetry={rl} /></Page>;

  return (
    <Page>
      <section className="welcome-card">
        <div>
          <span className="eyebrow"><Sparkles size={16} /> Welcome back, {user?.name?.split(" ")[0]}</span>
          <h2>Your next learning partner is probably already here.</h2>
          <p>Complete your request, review recent matches, and keep the community loop warm.</p>
        </div>
        <Link className="primary-button" to="/learn"><Plus size={18} /> Create Skill Request</Link>
      </section>
      <section className="metric-grid">
        <Metric icon={UsersRound} value={stats?.total_matches ?? 0} label="Total matches" />
        <Metric icon={ClipboardList} value={stats?.pending_requests ?? 0} label="Pending requests" />
        <Metric icon={TrendingUp} value={stats?.popular_skill ?? "—"} label="Popular skill" />
        <Metric icon={Check} value={`${stats?.profile_completion ?? 0}%`} label="Profile completion" />
      </section>
      <div className="dashboard-grid">
        <Panel title="Recent matches" action="View all">
          {ml ? <LoadingSpinner /> : recentMatches?.length ? recentMatches.map((m) => {
            const person = m.receiver?.id === user?.id ? m.requester : m.receiver;
            return person ? <MiniPerson key={m.id} person={person} /> : null;
          }) : <p>No matches yet.</p>}
        </Panel>
        <Panel title="Notifications" action="Open">
          {nl ? <LoadingSpinner /> : notifs?.length ? notifs.slice(0, 3).map((n) => (
            <Notice key={n.id} title={n.type.replace(/_/g, " ")} body={n.message} status={n.is_read ? "Read" : "Unread"} />
          )) : <p>No notifications.</p>}
        </Panel>
        <Panel title="Recent community posts" wide action="Feed">
          {pl ? <LoadingSpinner /> : posts?.length ? posts.map((post) => (
            <PostCard key={post.id} post={post} compact />
          )) : <p>No posts yet.</p>}
        </Panel>
        <Panel title="Quick actions">
          <div className="quick-grid">
            <Quick to="/learn" icon={Plus} label="Create Request" />
            <Quick to="/edit-profile" icon={PenLine} label="Edit Profile" />
            <Quick to="/feed" icon={MessageCircle} label="View Feed" />
            <Quick to="/matches" icon={Search} label="Find Matches" />
          </div>
        </Panel>
      </div>
    </Page>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LEARN (Create Skill Exchange) — FULLY FUNCTIONAL
   ═══════════════════════════════════════════════════════════════ */
function Learn() {
  const { user, refreshUser } = useAuth();
  const { data: skills, loading, error, reload } = useAPI(() => skillsAPI.list(), []);
  const navigate = useNavigate();

  const [teachSkill, setTeachSkill] = useState("");
  const [learnSkill, setLearnSkill] = useState("");
  const [level, setLevel] = useState("beginner");
  const [description, setDescription] = useState("");
  const [availability, setAvailability] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Filter out already-selected skills
  const teachOptions = (skills || []).filter(s => s.id !== learnSkill);
  const learnOptions = (skills || []).filter(s => s.id !== teachSkill);

  const handleSaveRequest = async () => {
    if (!teachSkill || !learnSkill) {
      setToast({ message: "Please select both a skill you know and a skill you want to learn.", type: "error" });
      return;
    }
    setSaving(true);
    try {
      // Add teach skill to user's profile
      try { await usersAPI.addSkill({ skill_id: teachSkill, skill_type: "teach", level }); } catch {}
      // Add learn skill to user's profile
      try { await usersAPI.addSkill({ skill_id: learnSkill, skill_type: "learn", level: "beginner" }); } catch {}
      await refreshUser();
      setToast({ message: "Skills saved to your profile! Now find your match.", type: "success" });
    } catch (e) {
      setToast({ message: e.response?.data?.error || "Failed to save. Try again.", type: "error" });
    }
    setSaving(false);
  };

  const handleFindMatch = () => {
    // Navigate to matches page with skill filters as query params
    const params = new URLSearchParams();
    if (teachSkill) params.set("teach", teachSkill);
    if (learnSkill) params.set("learn", learnSkill);
    navigate(`/matches?${params.toString()}`);
  };

  if (loading) return <Page><LoadingSpinner /></Page>;
  if (error) return <Page><ErrorBlock message={error} onRetry={reload} /></Page>;

  return (
    <Page>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <section className="form-layout">
        <form className="exchange-form" onSubmit={(e) => e.preventDefault()}>
          <h2>Build your exchange request</h2>
          <p>Tell PeerLift what you can teach and what you want to learn.</p>
          <label>Skill I Know
            <select value={teachSkill} onChange={(e) => setTeachSkill(e.target.value)}>
              <option value="">Select a skill</option>
              {teachOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label>Skill I Want to Learn
            <select value={learnSkill} onChange={(e) => setLearnSkill(e.target.value)}>
              <option value="">Select a skill</option>
              {learnOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label>Experience level
            <select value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>
          <label>Short description
            <textarea maxLength="240" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="I can help with reusable components and want practical ML project guidance." />
          </label>
          <label>Availability
            <input value={availability} onChange={(e) => setAvailability(e.target.value)}
              placeholder="Weekdays after 6 PM, Sunday morning" />
          </label>
          <div className="form-actions">
            <button type="button" className="primary-button" onClick={handleFindMatch} disabled={!teachSkill && !learnSkill}>
              <Search size={18} /> Find Match
            </button>
            <button type="button" className="secondary-button" onClick={handleSaveRequest} disabled={saving}>
              {saving ? <Loader2 className="spin" size={17} /> : null} Save Request
            </button>
          </div>
        </form>
        <aside className="suggestion-panel">
          <h3>Dynamic suggestions</h3>
          <div className="tag-cloud">
            {(skills || []).slice(0, 8).map((s) => (
              <span key={s.id} onClick={() => !teachSkill ? setTeachSkill(s.id) : setLearnSkill(s.id)}
                style={{ cursor: "pointer" }}>{s.name}</span>
            ))}
          </div>
          <div className="tip-card">
            <Star size={20} />
            <p>Requests with a clear project goal get 37% more accepted matches.</p>
          </div>
          {user?.skills_teaching?.length > 0 && (
            <div className="tip-card">
              <Check size={20} />
              <p>You're teaching: {user.skills_teaching.map(s => s.skill_name).join(", ")}</p>
            </div>
          )}
        </aside>
      </section>
    </Page>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MATCHES — with filter, connect, view profile
   ═══════════════════════════════════════════════════════════════ */
function Matches() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const teachFilter = searchParams.get("teach") || "";
  const learnFilter = searchParams.get("learn") || "";

  const { data: allSuggestions, loading: sl, error: se, reload: reloadSugg } = useAPI(() => matchesAPI.suggestions(), []);
  const { data: openReqs, loading: ol, reload: reloadOpen } = useAPI(() => matchesAPI.open({ teach: teachFilter, learn: learnFilter }), [teachFilter, learnFilter]);
  const { data: skills } = useAPI(() => skillsAPI.list(), []);
  const [filterSkill, setFilterSkill] = useState("");
  const [connecting, setConnecting] = useState(null);
  const [toast, setToast] = useState(null);

  // Apply filters: from Learn page params + local filter
  const suggestions = useMemo(() => {
    if (!allSuggestions) return [];
    let result = [...allSuggestions];

    // Filter by teach/learn from Learn page
    if (teachFilter && skills) {
      const skill = skills.find(s => s.id === teachFilter);
      if (skill) {
        result = result.filter(p => {
          const theirLearn = (p.skills_learning || []).map(s => s.skill_name?.toLowerCase());
          return theirLearn.includes(skill.name.toLowerCase());
        });
      }
    }
    if (learnFilter && skills) {
      const skill = skills.find(s => s.id === learnFilter);
      if (skill) {
        result = result.filter(p => {
          const theirTeach = (p.skills_teaching || []).map(s => s.skill_name?.toLowerCase());
          return theirTeach.includes(skill.name.toLowerCase());
        });
      }
    }

    // Local skill filter
    if (filterSkill) {
      result = result.filter(p => {
        const allSkills = [
          ...(p.skills_teaching || []).map(s => s.skill_name?.toLowerCase()),
          ...(p.skills_learning || []).map(s => s.skill_name?.toLowerCase()),
        ];
        return allSkills.some(s => s?.includes(filterSkill.toLowerCase()));
      });
    }

    return result;
  }, [allSuggestions, teachFilter, learnFilter, filterSkill, skills]);

  const handleConnect = async (person) => {
    if (!person) return;
    setConnecting(person.id);
    try {
      // Find a teach/learn skill pair for the match
      const myTeach = user?.skills_teaching?.[0];
      const myLearn = user?.skills_learning?.[0];
      const theirTeach = person.skills_teaching?.[0];
      const theirLearn = person.skills_learning?.[0];

      const teachId = teachFilter || myTeach?.skill_id || theirLearn?.skill_id;
      const learnId = learnFilter || myLearn?.skill_id || theirTeach?.skill_id;

      if (!teachId || !learnId) {
        setToast({ message: "Add skills to your profile first (Learn tab).", type: "error" });
        setConnecting(null);
        return;
      }

      await matchesAPI.create({
        receiver_id: person.id,
        teach_skill_id: teachId,
        learn_skill_id: learnId,
      });
      setToast({ message: `Match request sent to ${person.name}!`, type: "success" });
    } catch (e) {
      const msg = e.response?.data?.error || "Failed to connect.";
      setToast({ message: msg, type: "error" });
    }
    setConnecting(null);
  };

  const handleConnectOpen = async (openReq) => {
    try {
      await matchesAPI.accept(openReq.id);
      setToast({ message: `You accepted ${openReq.requester.name}'s request!`, type: "success" });
      reloadOpen();
    } catch (e) {
      setToast({ message: e.response?.data?.error || "Failed to connect.", type: "error" });
    }
  };

  const handleAddToQueue = async () => {
    try {
      await matchesAPI.create({
        teach_skill_id: teachFilter,
        learn_skill_id: learnFilter,
      });
      setToast({ message: "Your request has been added to the queue!", type: "success" });
      setTimeout(() => navigate("/queue"), 1500);
    } catch (e) {
      setToast({ message: e.response?.data?.error || "Failed to add to queue.", type: "error" });
    }
  };

  if (sl || ol) return <Page><LoadingSpinner /></Page>;
  if (se) return <Page><ErrorBlock message={se} onRetry={reloadSugg} /></Page>;

  return (
    <Page>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="toolbar">
        <span>{suggestions.length + (openReqs?.length || 0)} matches found</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div className="search" style={{ width: 220 }}>
            <Filter size={17} />
            <input value={filterSkill} onChange={(e) => setFilterSkill(e.target.value)}
              placeholder="Filter by skill name..." />
          </div>
          {filterSkill && (
            <button className="secondary-button" onClick={() => setFilterSkill("")} style={{ padding: "6px 12px" }}>
              <X size={16} /> Clear
            </button>
          )}
        </div>
      </div>
      
      {suggestions.length > 0 && (
        <section>
          <h3 style={{ marginBottom: "1rem" }}>Your Matches (Direct Skill Swaps)</h3>
          <div className="match-grid">
            {suggestions.map((person) => (
              <MatchCard key={person.id} person={person}
                onConnect={() => handleConnect(person)}
                onViewProfile={() => navigate(`/profile/${person.id}`)}
                connecting={connecting === person.id} />
            ))}
          </div>
        </section>
      )}

      {openReqs && openReqs.length > 0 && (
        <section style={{ marginTop: "2rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>Open Requests</h3>
          <div className="match-grid">
            {openReqs.map((req) => (
              <MatchCard key={req.id} person={{...req.requester, match_score: 100}}
                isQueueRequest={true}
                queueSkills={{ teach: req.teach_skill?.name, learn: req.learn_skill?.name }}
                onConnect={() => handleConnectOpen(req)}
                onViewProfile={() => navigate(`/profile/${req.requester.id}`)} />
            ))}
          </div>
        </section>
      )}

      {suggestions.length === 0 && (!openReqs || openReqs.length === 0) ? (
        <EmptyBlock
          icon={Sparkles} title="No matches found"
          message={filterSkill ? "Try a different filter or clear it." : "Your request can be added to the waiting queue while PeerLift keeps searching."}
          action={
            filterSkill
              ? <button className="primary-button" onClick={() => setFilterSkill("")}>Clear Filter</button>
              : (
                <div style={{display: "flex", gap: "10px"}}>
                  {teachFilter && learnFilter && <button className="primary-button" onClick={handleAddToQueue}>Add to Queue</button>}
                  <button className="secondary-button" onClick={() => navigate("/learn")}>Try Different Skills</button>
                </div>
              )
          }
        />
      ) : null}
    </Page>
  );
}

function MatchCard({ person, onConnect, onViewProfile, connecting, isQueueRequest, queueSkills }) {
  const allSkills = [...(person.skills_teaching || []), ...(person.skills_learning || [])];
  return (
    <article className="match-card" style={isQueueRequest ? { border: "2px solid var(--blue)" } : {}}>
      <div className="match-head">
        <InitialAvatar name={person.name} />
        <div><h3>{person.name}</h3><p>{person.username} · {person.college}</p></div>
        <strong>{person.match_score ?? 0}%</strong>
      </div>
      {isQueueRequest ? (
        <div className="tip-card" style={{margin: "12px 0"}}>
          <strong>Needs:</strong> {queueSkills.learn}<br/>
          <strong>Offers:</strong> {queueSkills.teach}
        </div>
      ) : <p>{person.bio}</p>}
      <div className="tag-cloud">
        {allSkills.slice(0, 4).map((s, i) => <span key={s.skill_id || i}>{s.skill_name}</span>)}
      </div>
      <div className="card-actions">
        <button className="primary-button" onClick={onConnect} disabled={connecting}>
          {connecting ? <Loader2 className="spin" size={17} /> : <UserRoundPlus size={17} />} Connect
        </button>
        <button onClick={onViewProfile}>View Profile</button>
        <Link to="/chat">Chat</Link>
      </div>
    </article>
  );
}

/* ═══════════════════════════════════════════════════════════════
   QUEUE — with cancel support
   ═══════════════════════════════════════════════════════════════ */
function Queue() {
  const { user } = useAuth();
  const { data: matches, loading, error, reload } = useAPI(() => matchesAPI.list({ status: "pending" }), []);
  const [toast, setToast] = useState(null);

  const handleAccept = async (id) => {
    try { await matchesAPI.accept(id); reload(); setToast({ message: "Match accepted!", type: "success" }); } 
    catch (e) { setToast({ message: e.response?.data?.error || "Failed to accept.", type: "error" }); }
  };
  const handleReject = async (id) => {
    try { await matchesAPI.reject(id); reload(); setToast({ message: "Match rejected.", type: "info" }); } 
    catch (e) { setToast({ message: e.response?.data?.error || "Failed to reject.", type: "error" }); }
  };

  const handleCancel = async (id) => {
    try { await matchesAPI.cancel(id); reload(); setToast({ message: "Request cancelled.", type: "info" }); } 
    catch (e) { setToast({ message: e.response?.data?.error || "Failed to cancel.", type: "error" }); }
  };

  if (loading) return <Page><LoadingSpinner /></Page>;
  if (error) return <Page><ErrorBlock message={error} onRetry={reload} /></Page>;

  return (
    <Page>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <Panel title="Pending skill exchange requests">
        {!matches?.length ? (
          <EmptyBlock icon={ClipboardList} title="Queue is empty"
            message="No pending requests. Create a skill exchange from the Learn tab."
            action={<Link to="/learn" className="primary-button"><Plus size={17} /> Create Request</Link>} />
        ) : (
          <div className="table-list">
            {matches.map((m) => {
              const isReceiver = m.receiver?.id === user?.id;
              const isRequester = m.requester?.id === user?.id;
              const otherName = isReceiver ? m.requester?.name : (m.receiver?.name || "(Open Request)");
              return (
                <div className="table-row" key={m.id}>
                  <div>
                    <strong>{m.teach_skill?.name || "—"} ↔ {m.learn_skill?.name || "—"}</strong>
                    <span>with {otherName}</span>
                  </div>
                  <span>{new Date(m.created_at).toLocaleDateString()}</span>
                  <span className="pill">{m.status}</span>
                  <div className="row-actions">
                    {isReceiver && m.receiver && (
                      <>
                        <button className="primary-button" style={{ padding: "4px 12px" }} onClick={() => handleAccept(m.id)}>Accept</button>
                        <button onClick={() => handleReject(m.id)}>Reject</button>
                      </>
                    )}
                    {isRequester && (
                      <button onClick={() => handleCancel(m.id)}>Cancel Request</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </Page>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FEED
   ═══════════════════════════════════════════════════════════════ */
function Feed() {
  const { user } = useAuth();
  const { data: posts, loading, error, reload, setData } = useAPI(() => postsAPI.list({ per_page: 50 }), []);
  const { data: trending } = useAPI(() => skillsAPI.trending(), []);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  const handlePost = async () => {
    if (!text.trim() || posting) return;
    setPosting(true);
    try {
      const res = await postsAPI.create({ content: text });
      setData([res.data, ...(posts || [])]);
      setText("");
    } catch {}
    setPosting(false);
  };

  const toggleLike = async (postId) => {
    try {
      const res = await postsAPI.like(postId);
      setData((posts || []).map(p =>
        p.id === postId ? { ...p, is_liked_by_me: res.data.liked, likes_count: res.data.likes_count } : p
      ));
    } catch {}
  };

  if (loading) return <Page><LoadingSpinner /></Page>;
  if (error) return <Page><ErrorBlock message={error} onRetry={reload} /></Page>;

  return (
    <Page>
      <div className="feed-layout">
        <section>
          <div className="composer">
            <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength="280" placeholder="Share a question, win, project update, or collaboration request..." />
            <div className="composer-actions">
              <span>{text.length}/280</span>
              <button className="secondary-button" onClick={() => setText("")}>Cancel</button>
              <button className="primary-button" onClick={handlePost} disabled={posting}>
                {posting ? <Loader2 className="spin" size={17} /> : <Send size={17} />} Post
              </button>
            </div>
          </div>
          {(posts || []).map((post) => (
            <PostCard key={post.id} post={post} liked={post.is_liked_by_me} onLike={() => toggleLike(post.id)} />
          ))}
          {posts?.length === 0 && <EmptyBlock icon={MessageCircle} title="No posts yet" message="Be the first to share something!" />}
        </section>
        <aside className="side-panel">
          <h3>Trending skills</h3>
          {(trending || []).slice(0, 5).map((s) => <span className="trend" key={s.id || s.name}>#{s.name}</span>)}
        </aside>
      </div>
    </Page>
  );
}

function PostCard({ post, liked, onLike, compact }) {
  return (
    <article className={`post-card ${compact ? "compact" : ""}`}>
      <header>
        <InitialAvatar name={post.author?.name || "?"} />
        <div>
          <strong>{post.author?.name}</strong>
          <span>{post.author?.username} · {timeAgo(post.created_at)}</span>
        </div>
        <button><MoreHorizontal size={18} /></button>
      </header>
      <p>{post.content}</p>
      {!compact && (
        <footer>
          <button onClick={onLike} className={liked ? "liked" : ""}>
            <Heart size={18} /> {post.likes_count ?? 0}
          </button>
          <button><MessageCircle size={18} /> {post.comments_count ?? 0}</button>
        </footer>
      )}
    </article>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

/* ═══════════════════════════════════════════════════════════════
   PROFILE (own)
   ═══════════════════════════════════════════════════════════════ */
function Profile() {
  const { user } = useAuth();
  if (!user) return <Page><LoadingSpinner /></Page>;
  const teaching = user.skills_teaching || [];
  const learning = user.skills_learning || [];
  return (
    <Page>
      <section className="profile-hero">
        <InitialAvatar name={user.name} className="profile-avatar" />
        <div>
          <h2>{user.name}</h2>
          <p>@{user.username} · {user.branch || "Student"} · {user.current_year ? `Year ${user.current_year}` : ""}</p>
          <div className="tag-cloud">
            {teaching.map(s => <span key={s.skill_id + "t"}>{s.skill_name}</span>)}
            {learning.map(s => <span key={s.skill_id + "l"}>{s.skill_name}</span>)}
          </div>
        </div>
        <Link to="/edit-profile" className="primary-button"><PenLine size={17} /> Edit Profile</Link>
      </section>
      <section className="profile-grid">
        <InfoPanel title="Basic Information" rows={[
          `Name: ${user.name}`, `Email: ${user.email || "—"}`, `Bio: ${user.bio || "No bio yet."}`, `College: ${user.college || "—"}`
        ]} />
        <InfoPanel title="Academic Information" rows={[
          `Degree: ${user.degree || "—"}`, `Branch: ${user.branch || "—"}`, `Year: ${user.current_year || "—"}`
        ]} />
        <InfoPanel title="Professional Information" rows={[
          `GitHub: ${user.github_url || "—"}`, `LinkedIn: ${user.linkedin_url || "—"}`,
          `Portfolio: ${user.portfolio_url || "—"}`,
        ]} />
        <InfoPanel title="Skills & Goals" rows={[
          `Teaching: ${teaching.map(s => `${s.skill_name} (${s.level})`).join(", ") || "—"}`,
          `Learning: ${learning.map(s => `${s.skill_name} (${s.level})`).join(", ") || "—"}`,
        ]} />
      </section>
    </Page>
  );
}

/* ═══════════════════════════════════════════════════════════════
   USER PROFILE (other user)
   ═══════════════════════════════════════════════════════════════ */
function UserProfile() {
  const { userId } = useParams();
  const { data: person, loading, error, reload } = useAPI(() => usersAPI.get(userId), [userId]);

  if (loading) return <Page><LoadingSpinner /></Page>;
  if (error) return <Page><ErrorBlock message={error} onRetry={reload} /></Page>;
  if (!person) return <Page><ErrorBlock message="User not found." /></Page>;

  const teaching = person.skills_teaching || [];
  const learning = person.skills_learning || [];

  return (
    <Page>
      <section className="profile-hero">
        <InitialAvatar name={person.name} className="profile-avatar" />
        <div>
          <h2>{person.name}</h2>
          <p>@{person.username} · {person.branch || "Student"} · {person.current_year ? `Year ${person.current_year}` : ""}</p>
          <div className="tag-cloud">
            {teaching.map(s => <span key={s.skill_id + "t"}>{s.skill_name}</span>)}
            {learning.map(s => <span key={s.skill_id + "l"}>{s.skill_name}</span>)}
          </div>
        </div>
      </section>
      <section className="profile-grid">
        <InfoPanel title="About" rows={[
          `Bio: ${person.bio || "No bio yet."}`, `College: ${person.college || "—"}`
        ]} />
        <InfoPanel title="Academic" rows={[
          `Degree: ${person.degree || "—"}`, `Branch: ${person.branch || "—"}`, `Year: ${person.current_year || "—"}`
        ]} />
        <InfoPanel title="Links" rows={[
          `GitHub: ${person.github_url || "—"}`, `LinkedIn: ${person.linkedin_url || "—"}`,
          `Portfolio: ${person.portfolio_url || "—"}`,
        ]} />
        <InfoPanel title="Skills" rows={[
          `Teaching: ${teaching.map(s => `${s.skill_name} (${s.level})`).join(", ") || "—"}`,
          `Learning: ${learning.map(s => `${s.skill_name} (${s.level})`).join(", ") || "—"}`,
        ]} />
      </section>
    </Page>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EDIT PROFILE — ALL FIELDS
   ═══════════════════════════════════════════════════════════════ */
function EditProfile() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.target);
    try {
      await usersAPI.updateMe({
        name: fd.get("name"),
        college: fd.get("college"),
        degree: fd.get("degree"),
        branch: fd.get("branch"),
        current_year: fd.get("current_year") ? parseInt(fd.get("current_year")) : null,
        bio: fd.get("bio"),
        github_url: fd.get("github_url"),
        linkedin_url: fd.get("linkedin_url"),
        portfolio_url: fd.get("portfolio_url"),
        avatar_url: fd.get("avatar_url"),
      });
      await refreshUser();
      setToast({ message: "Profile saved!", type: "success" });
      setTimeout(() => navigate("/profile"), 800);
    } catch (e) {
      setToast({ message: e.response?.data?.error || "Failed to save.", type: "error" });
    }
    setSaving(false);
  };

  if (!user) return <Page><LoadingSpinner /></Page>;

  return (
    <Page>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <form className="edit-grid" onSubmit={handleSave}>
        <h2 className="span-2" style={{ margin: 0, marginBottom: 8 }}>Edit Your Profile</h2>

        <Field label="Full Name" name="name" defaultValue={user.name} placeholder="Your full name" required />
        <Field label="Username" name="username" defaultValue={user.username} placeholder="Username" disabled />
        <Field label="Email" name="email" defaultValue={user.email} placeholder="Email" disabled />
        <Field label="College / University" name="college" defaultValue={user.college} placeholder="e.g. Parul University" />
        <Field label="Degree" name="degree" defaultValue={user.degree} placeholder="e.g. B.Tech, M.Sc" />
        <Field label="Branch / Major" name="branch" defaultValue={user.branch} placeholder="e.g. Computer Science" />
        <Field label="Current Year" name="current_year" defaultValue={user.current_year} placeholder="e.g. 3" type="number" min="1" max="6" />
        <Field label="Avatar URL" name="avatar_url" defaultValue={user.avatar_url} placeholder="Link to your profile photo" />
        <Field label="GitHub URL" name="github_url" defaultValue={user.github_url} placeholder="https://github.com/you" />
        <Field label="LinkedIn URL" name="linkedin_url" defaultValue={user.linkedin_url} placeholder="https://linkedin.com/in/you" />
        <Field label="Portfolio URL" name="portfolio_url" defaultValue={user.portfolio_url} placeholder="https://yoursite.com" />

        <div className="field span-2">
          <label>Bio</label>
          <textarea name="bio" defaultValue={user.bio} placeholder="Write a professional student bio — your interests, goals, and what you're working on." rows={4} />
        </div>

        <div className="span-2" style={{ display: "flex", gap: 12 }}>
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? <Loader2 className="spin" size={18} /> : <Check size={18} />} Save Profile
          </button>
          <button type="button" className="secondary-button" onClick={() => navigate("/profile")}>Cancel</button>
        </div>
      </form>
    </Page>
  );
}

/* ═══════════════════════════════════════════════════════════════
   NOTIFICATIONS
   ═══════════════════════════════════════════════════════════════ */
function Notifications() {
  const { data, loading, error, reload } = useAPI(() => notificationsAPI.list({ per_page: 50 }), []);

  const markAll = async () => {
    try { await notificationsAPI.markAllRead(); reload(); } catch {}
  };

  if (loading) return <Page><LoadingSpinner /></Page>;
  if (error) return <Page><ErrorBlock message={error} onRetry={reload} /></Page>;

  return (
    <Page>
      <Panel title="Notifications" action="Mark all read" onAction={markAll}>
        {!data?.length ? (
          <EmptyBlock icon={Bell} title="All caught up" message="No notifications yet." />
        ) : data.map((n) => (
          <Notice key={n.id} title={n.type.replace(/_/g, " ")} body={n.message} status={n.is_read ? "Read" : "Unread"} />
        ))}
      </Panel>
    </Page>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CHAT
   ═══════════════════════════════════════════════════════════════ */
function Chat() {
  const { user } = useAuth();
  const { data: convos, loading } = useAPI(() => messagesAPI.conversations(), []);
  const [active, setActive] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [msgText, setMsgText] = useState("");
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const messagesEndRef = React.useRef(null);
  const inputRef = React.useRef(null);

  const openConvo = async (matchId) => {
    setActive(matchId);
    setLoadingMsgs(true);
    try {
      const res = await messagesAPI.thread(matchId);
      setMsgs(res.data || []);
      await messagesAPI.markRead(matchId);
    } catch {}
    setLoadingMsgs(false);
  };

  const sendMsg = async () => {
    if (!msgText.trim() || !active) return;
    try {
      const res = await messagesAPI.send(active, { content: msgText });
      setMsgs(prev => [...prev, res.data]);
      setMsgText("");
      setTimeout(() => inputRef.current?.focus(), 10);
    } catch {}
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(async () => {
      try {
        const res = await messagesAPI.thread(active);
        // Only update if there are new messages to avoid cursor jumping
        setMsgs(prev => {
          if (prev.length !== res.data.length) return res.data || [];
          return prev;
        });
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [active]);

  if (loading) return <Page><LoadingSpinner /></Page>;

  const activeConvo = (convos || []).find(c => c.match_id === active);

  return (
    <Page>
      <section className="chat-shell">
        <aside>
          {(convos || []).length === 0 ? (
            <EmptyBlock icon={Send} title="No conversations" message="Accept a match to start chatting!" />
          ) :
            (convos || []).map((c) => (
              <div key={c.match_id} className={`mini-person ${c.match_id === active ? "active-chat" : ""}`}
                onClick={() => openConvo(c.match_id)} style={{ cursor: "pointer" }}>
                <InitialAvatar name={c.other_user?.name || "?"} />
                <div>
                  <strong>{c.other_user?.name}</strong>
                  <span>{c.last_message?.content?.slice(0, 30) || "No messages yet"}{c.unread_count > 0 ? ` (${c.unread_count})` : ""}</span>
                </div>
              </div>
            ))
          }
        </aside>
        <div className="chat-window">
          <div className="chat-top">
            <strong>{activeConvo?.other_user?.name || "Select a conversation"}</strong>
            {activeConvo && <span>Online</span>}
          </div>
          <div className="messages">
            {loadingMsgs ? <LoadingSpinner /> :
              !active ? <p style={{ color: "#64748b", textAlign: "center", marginTop: 40 }}>Select a conversation to view messages.</p> :
              msgs.length === 0 ? <p style={{ color: "#64748b", textAlign: "center", marginTop: 40 }}>No messages yet. Say hello!</p> :
              msgs.map((m) => (
                <p key={m.id} className={`bubble ${m.sender?.id === user?.id ? "outgoing" : "incoming"}`}>{m.content}</p>
              ))
            }
            <div ref={messagesEndRef} />
          </div>
          <div className="chat-input">
            <input ref={inputRef} value={msgText} onChange={(e) => setMsgText(e.target.value)} placeholder="Write a message"
              onKeyDown={(e) => e.key === "Enter" && sendMsg()} disabled={!active} />
            <button className="primary-button" onClick={sendMsg} disabled={!active}><Send size={17} /></button>
          </div>
        </div>
      </section>
    </Page>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ADMIN
   ═══════════════════════════════════════════════════════════════ */
function AdminDashboard() {
  const { data: stats, loading: sl, error: se, reload } = useAPI(() => adminAPI.stats(), []);
  const { data: popular, loading: pl } = useAPI(() => adminAPI.popularSkills(), []);

  if (sl) return <Page><LoadingSpinner /></Page>;
  if (se) return <Page><ErrorBlock message={se} onRetry={reload} /></Page>;

  return (
    <Page>
      <section className="metric-grid">
        <Metric icon={UsersRound} value={stats?.total_users ?? 0} label="Total users" />
        <Metric icon={ClipboardList} value={stats?.active_requests ?? 0} label="Active requests" />
        <Metric icon={MessageCircle} value={stats?.total_posts ?? 0} label="Posts count" />
        <Metric icon={ChartNoAxesCombined} value={`${stats?.match_success_rate ?? 0}%`} label="Match success" />
      </section>
      <div className="dashboard-grid">
        <Panel title="Most popular skills" wide>
          {pl ? <LoadingSpinner /> : <BarChartFromData data={popular} />}
        </Panel>
        <Panel title="Moderation queue">
          <Notice title={`${stats?.active_requests ?? 0} requests open`} body="Review pending matches and reported posts." status="Unread" />
        </Panel>
      </div>
    </Page>
  );
}

function UserManagement() {
  const { data: users, loading, error, reload } = useAPI(() => adminAPI.users({ per_page: 50 }), []);

  const handleBan = async (id) => {
    try { await adminAPI.banUser(id); reload(); } catch {}
  };
  const handleDelete = async (id) => {
    try { await adminAPI.deleteUser(id); reload(); } catch {}
  };

  if (loading) return <Page><LoadingSpinner /></Page>;
  if (error) return <Page><ErrorBlock message={error} onRetry={reload} /></Page>;

  return (
    <Page>
      <Panel title="Users">
        <div className="table-list">
          {(users || []).map((u) => (
            <div className="table-row admin-row" key={u.id}>
              <span>{u.name}</span>
              <span>{u.email}</span>
              <span>{u.is_admin ? "Admin" : "Student"}</span>
              <span>{u.is_banned ? "Banned" : "Active"}</span>
              <div className="row-actions">
                {!u.is_admin && <button onClick={() => handleBan(u.id)}>{u.is_banned ? "Unban" : "Ban"}</button>}
                {!u.is_admin && <button onClick={() => handleDelete(u.id)}>Remove</button>}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </Page>
  );
}

function PostModeration() {
  const { data: posts, loading, error, reload } = useAPI(() => adminAPI.reportedPosts({ per_page: 50 }), []);

  const dismiss = async (id) => { try { await adminAPI.dismissReport(id); reload(); } catch {} };
  const remove = async (id) => { try { await adminAPI.deletePost(id); reload(); } catch {} };

  if (loading) return <Page><LoadingSpinner /></Page>;
  if (error) return <Page><ErrorBlock message={error} onRetry={reload} /></Page>;

  return (
    <Page>
      <Panel title="Reported posts">
        {!posts?.length ? <p>No reported posts. All clear!</p> : (
          <div className="table-list">
            {posts.map((p) => (
              <div className="table-row admin-row" key={p.id}>
                <span>{p.author?.name}</span>
                <span>{p.content?.slice(0, 60)}...</span>
                <span>Feed</span>
                <span>Reported</span>
                <div className="row-actions">
                  <button onClick={() => dismiss(p.id)}>Dismiss</button>
                  <button onClick={() => remove(p.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </Page>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MOUNT
   ═══════════════════════════════════════════════════════════════ */
createRoot(document.getElementById("root")).render(<App />);
