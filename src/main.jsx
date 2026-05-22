import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Bell,
  BookOpen,
  ChartNoAxesCombined,
  Check,
  ChevronRight,
  CircleUserRound,
  ClipboardList,
  Eye,
  EyeOff,
  Filter,
  Heart,
  Home,
  LayoutDashboard,
  MessageCircle,
  MoreHorizontal,
  PenLine,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Tags,
  TrendingUp,
  UserRoundPlus,
  UsersRound,
  Zap
} from "lucide-react";
import {
  HashRouter,
  Link,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation
} from "react-router-dom";
import "./styles.css";

const people = [
  {
    name: "Rudra Patel",
    username: "@rudzzy",
    college: "Parul University - PIT",
    skills: ["React", "Figma", "Design Systems"],
    wants: "Python automation",
    level: "Intermediate",
    match: 96,
    bio: "Frontend student who loves clean dashboards and design critique.",
    status: "online"
  },
  {
    name: "Karan Vishwakarma",
    username: "@karanvishwakarma",
    college: "Parul University - PIET",
    skills: ["Python", "Cloud", "Andriod", "p5.js"],
    wants: "Public speaking",
    level: "Advanced",
    match: 91,
    bio: "Builds analytics projects and can help with practical ML basics.",
    status: "offline"
  },
  {
    name: "Bharathraj",
    username: "@bharat",
    college: "Parul University",
    skills: ["DBMS", "SQL", "MongoDB"],
    wants: "Backend fundamentals",
    level: "Intermediate",
    match: 87,
    bio: "Frontend-focused builder looking for a weekly accountability partner.",
    status: "offline"
  },
  {
    name: "Thirandas Ganesh",
    username: "@thirandasganesh",
    college: "Parul University",
    skills: ["Node.js", "APIs", "MongoDB"],
    wants: "UI fundamentals",
    level: "Intermediate",
    match: 85,
    bio: "Backend-focused builder looking for a weekly accountability partner.",
    status: "online"
  }
];

const postsSeed = [
  {
    id: 1,
    author: people[1],
    time: "12 min ago",
    text: "Finished my first dashboard with React Query today. Happy to pair with anyone learning API state management this weekend.",
    likes: 42,
    tags: ["React", "PairLearning"]
  },
  {
    id: 2,
    author: people[2],
    time: "1 hr ago",
    text: "Looking for a Figma buddy. I can trade backend API review for help making my portfolio homepage less chaotic.",
    likes: 28,
    tags: ["Figma", "Portfolio"]
  },
  {
    id: 3,
    author: people[0],
    time: "Yesterday",
    text: "Tiny win: shipped a component library for our club website. Naming tokens is surprisingly hard.",
    likes: 64,
    tags: ["DesignSystems"]
  }
];

const notifications = [
  ["Match found", "Karan can teach Python and wants presentation practice.", "Unread"],
  ["Post liked", "Bharathraj liked your community post.", "Read"],
  ["Request accepted", "Aarya accepted your React mentoring request.", "Unread"],
  ["New connection", "Preet added you as a learning partner.", "Read"]
];

const queuedRequests = [
  ["JavaScript fundamentals", "Graphic design basics", "May 22, 2026", "Searching"],
  ["Git & GitHub", "Public speaking", "May 20, 2026", "Waiting"],
  ["SQL queries", "Resume review", "May 18, 2026", "Matched soon"]
];

const skillOptions = [
  "React",
  "Python",
  "Java",
  "Figma",
  "SQL",
  "Public Speaking",
  "DSA",
  "Node.js",
  "UI Design",
  "Machine Learning",
  "GitHub",
  "Excel"
];

function App() {
  const [posts, setPosts] = useState(postsSeed);
  const [liked, setLiked] = useState({ 1: true });
  const addPost = (text) => {
    if (!text.trim()) return;
    setPosts([
      {
        id: Date.now(),
        author: {
          name: "Karan Vishwakarma",
          username: "@karan"
        },
        time: "Just now",
        text,
        likes: 0,
        tags: ["PeerLift"]
      },
      ...posts
    ]);
  };

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/signup" element={<Auth mode="signup" />} />
        <Route element={<StudentShell />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/queue" element={<Queue />} />
          <Route
            path="/feed"
            element={<Feed posts={posts} liked={liked} setLiked={setLiked} addPost={addPost} />}
          />
          <Route path="/profile" element={<Profile />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/chat" element={<Chat />} />
        </Route>
        <Route element={<AdminShell />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/posts" element={<PostModeration />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

function Brand() {
  return (
    <Link className="brand" to="/">
      <span className="brand-mark">
        <Sparkles size={20} />
      </span>
      <span>PeerLift</span>
    </Link>
  );
}

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
          <p>
            Trade what you know for what you want to learn. Find students who can mentor,
            collaborate, review your work, and grow with you.
          </p>
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
          <article className="feature-card" key={title}>
            <Icon size={24} />
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </section>

      <section className="how-grid">
        <div>
          <span className="eyebrow"><Tags size={16} /> How matching works</span>
          <h2>Teach one skill. Learn another. Keep momentum visible.</h2>
        </div>
        {["Create your profile", "Post a skill exchange", "Connect with top matches", "Learn through chat and feed"].map((item, index) => (
          <div className="step-card" key={item}>
            <span>{index + 1}</span>
            <strong>{item}</strong>
          </div>
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

function Auth({ mode }) {
  const isSignup = mode === "signup";
  const [show, setShow] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  return (
    <main className="auth-page">
      <div className="auth-panel">
        <Brand />
        <h1>{isSignup ? "Create your PeerLift account" : "Welcome back"}</h1>
        <p>{isSignup ? "Build your student profile and start matching today." : "Jump back into your learning exchange hub."}</p>
        <form onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}>
          {isSignup && (
            <>
              <Field label="Full name" placeholder="what people call you?" />
              <Field label="Username" placeholder="you nick name" />
            </>
          )}
          <Field label="Email" placeholder="you@college.edu" type="email" />
          <div className="field">
            <label>Password</label>
            <div className="password-wrap">
              <input type={show ? "text" : "password"} placeholder="Minimum 8 characters" />
              <button type="button" onClick={() => setShow(!show)} aria-label="Toggle password visibility">
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {isSignup && (
            <>
              <Field label="Confirm password" placeholder="Repeat password" type="password" />
              <Field label="College/University" placeholder="Your campus name" />
            </>
          )}
          {!isSignup && (
            <div className="form-row">
              <label className="check"><input type="checkbox" /> Remember me</label>
              <a href="#forgot">Forgot password?</a>
            </div>
          )}
          {submitted && <div className="form-alert">Demo validation passed. Redirecting would happen here.</div>}
          <Link to="/dashboard" className="primary-button full">{isSignup ? "Create Account" : "Login"}</Link>
          <button className="secondary-button full" type="button">Continue with Google</button>
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

function Field({ label, ...props }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input {...props} />
    </div>
  );
}

function StudentShell() {
  return <Shell nav={studentNav} admin={false} />;
}

function AdminShell() {
  return <Shell nav={adminNav} admin />;
}

const studentNav = [
  ["/dashboard", "Dashboard", Home],
  ["/learn", "Learn", BookOpen],
  ["/matches", "Matches", UsersRound],
  ["/queue", "Queue", ClipboardList],
  ["/feed", "Feed", MessageCircle],
  ["/profile", "Profile", CircleUserRound],
  ["/notifications", "Notifications", Bell],
  ["/chat", "Chat", Send]
];

const adminNav = [
  ["/admin", "Overview", LayoutDashboard],
  ["/admin/users", "Users", UsersRound],
  ["/admin/posts", "Moderation", ShieldCheck]
];

function Shell({ nav, admin }) {
  const location = useLocation();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <nav>
          {nav.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} className={({ isActive }) => isActive ? "active" : ""}>
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <Link className="sidebar-cta" to={admin ? "/dashboard" : "/admin"}>
          {admin ? <Home size={18} /> : <ShieldCheck size={18} />}
          <span>{admin ? "Student view" : "Admin view"}</span>
        </Link>
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
            <InitialAvatar name="Priya Sharma" className="avatar" />
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}

function titleFor(path) {
  const titles = {
    "/dashboard": "Dashboard",
    "/learn": "Create Skill Exchange",
    "/matches": "Match Results",
    "/queue": "Pending Queue",
    "/feed": "Community Feed",
    "/profile": "Profile",
    "/edit-profile": "Edit Profile",
    "/notifications": "Notifications",
    "/chat": "Chat",
    "/admin": "Admin Dashboard",
    "/admin/users": "User Management",
    "/admin/posts": "Post Moderation"
  };
  return titles[path] || "PeerLift";
}

function Dashboard() {
  return (
    <Page>
      <section className="welcome-card">
        <div>
          <span className="eyebrow"><Sparkles size={16} /> Welcome back, Rudra</span>
          <h2>Your next learning partner is probably already here.</h2>
          <p>Complete your request, review recent matches, and keep the community loop warm.</p>
        </div>
        <Link className="primary-button" to="/learn"><Plus size={18} /> Create Skill Request</Link>
      </section>
      <section className="metric-grid">
        <Metric icon={UsersRound} value="18" label="Total matches" />
        <Metric icon={ClipboardList} value="5" label="Pending requests" />
        <Metric icon={TrendingUp} value="React" label="Popular skill" />
        <Metric icon={Check} value="82%" label="Profile completion" />
      </section>
      <div className="dashboard-grid">
        <Panel title="Recent matches" action="View all">
          {people.map((person) => <MiniPerson key={person.name} person={person} />)}
        </Panel>
        <Panel title="Notifications" action="Open">
          {notifications.slice(0, 3).map(([title, body, status]) => <Notice key={body} title={title} body={body} status={status} />)}
        </Panel>
        <Panel title="Recent community posts" wide action="Feed">
          {postsSeed.slice(0, 2).map((post) => <PostCard key={post.id} post={post} compact />)}
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

function Learn() {
  const [known, setKnown] = useState("React");
  const suggestions = useMemo(() => skillOptions.filter((skill) => skill !== known).slice(0, 6), [known]);
  return (
    <Page>
      <section className="form-layout">
        <form className="exchange-form">
          <h2>Build your exchange request</h2>
          <p>Tell PeerLift what you can teach and what you want to learn.</p>
          <label>Skill I Know<select value={known} onChange={(event) => setKnown(event.target.value)}>{skillOptions.map((skill) => <option key={skill}>{skill}</option>)}</select></label>
          <label>Skill I Want to Learn<select>{suggestions.map((skill) => <option key={skill}>{skill}</option>)}</select></label>
          <label>Experience level<select><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
          <label>Short description<textarea maxLength="240" placeholder="I can help with reusable components and want practical ML project guidance." /></label>
          <label>Availability<input placeholder="Weekdays after 6 PM, Sunday morning" /></label>
          <div className="form-actions">
            <Link to="/matches" className="primary-button"><Search size={18} /> Find Match</Link>
            <button type="button" className="secondary-button">Save Request</button>
          </div>
        </form>
        <aside className="suggestion-panel">
          <h3>Dynamic suggestions</h3>
          <div className="tag-cloud">{suggestions.map((skill) => <span key={skill}>{skill}</span>)}</div>
          <div className="tip-card">
            <Star size={20} />
            <p>Requests with a clear project goal get 37% more accepted matches in this demo dataset.</p>
          </div>
        </aside>
      </section>
    </Page>
  );
}

function Matches() {
  return (
    <Page>
      <div className="toolbar"><span>3 high-fit matches found</span><button className="secondary-button"><Filter size={17} /> Filter</button></div>
      <section className="match-grid">
        {people.map((person) => <MatchCard key={person.name} person={person} />)}
      </section>
      <section className="empty-state">
        <Sparkles size={28} />
        <h3>No perfect match yet?</h3>
        <p>Your request can be added to the waiting queue while PeerLift keeps searching.</p>
        <Link to="/queue" className="primary-button">Add to Queue</Link>
      </section>
    </Page>
  );
}

function Queue() {
  return (
    <Page>
      <Panel title="Pending skill exchange requests">
        <div className="table-list">
          {queuedRequests.map(([known, want, date, status]) => (
            <div className="table-row" key={known}>
              <div><strong>{known}</strong><span>Want to learn {want}</span></div>
              <span>{date}</span>
              <span className="pill">{status}</span>
              <div className="row-actions"><button>Edit</button><button>Cancel</button></div>
            </div>
          ))}
        </div>
      </Panel>
    </Page>
  );
}

function Feed({ posts, liked, setLiked, addPost }) {
  const [text, setText] = useState("");
  return (
    <Page>
      <div className="feed-layout">
        <section>
          <div className="composer">
            <textarea value={text} onChange={(event) => setText(event.target.value)} maxLength="280" placeholder="Share a question, win, project update, or collaboration request..." />
            <div className="composer-actions">
              <span>{text.length}/280</span>
              <button className="secondary-button" onClick={() => setText("")}>Cancel</button>
              <button className="primary-button" onClick={() => { addPost(text); setText(""); }}><Send size={17} /> Post</button>
            </div>
          </div>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              liked={liked[post.id]}
              onLike={() => setLiked({ ...liked, [post.id]: !liked[post.id] })}
            />
          ))}
        </section>
        <aside className="side-panel">
          <h3>Trending skills</h3>
          {["React", "Python", "Figma", "DSA", "Public Speaking"].map((skill) => <span className="trend" key={skill}>#{skill}</span>)}
        </aside>
      </div>
    </Page>
  );
}

function Profile() {
  return (
    <Page>
      <section className="profile-hero">
        <InitialAvatar name="Rudra Patel" className="profile-avatar" />
        <div>
          <h2>Rudra Patel</h2>
          <p>@rudzzy - Computer Science - 4th year</p>
          <div className="tag-cloud"><span>React</span><span>UI Design</span><span>GitHub</span><span>Learning ML</span></div>
        </div>
        <Link to="/edit-profile" className="primary-button"><PenLine size={17} /> Edit Profile</Link>
      </section>
      <section className="profile-grid">
        <InfoPanel title="Basic Information" rows={["Gender: Male", "Bio: Frontend learner building polished student tools.", "College: Parul University - PIT"]} />
        <InfoPanel title="Academic Information" rows={["Degree: B.Tech", "Branch: Computer Science", "Qualification: Undergraduate"]} />
        <InfoPanel title="Professional Information" rows={["Technologies: React, CSS, Firebase", "Certifications: UI Foundations", "Projects: Campus events dashboard", "GitHub: github.com/rudzzy"]} />
        <InfoPanel title="Interests" rows={["Learning goals: Machine learning basics", "Domains: EdTech, productivity", "Collaboration: Hackathons, portfolio reviews"]} />
      </section>
    </Page>
  );
}

function EditProfile() {
  return (
    <Page>
      <form className="edit-grid">
        {["Name", "Username", "Gender", "College", "Degree", "Branch", "Current year", "Qualification", "GitHub", "LinkedIn", "Portfolio"].map((label) => <Field key={label} label={label} placeholder={label} />)}
        <label className="field span-2">Bio<textarea placeholder="Write a professional student bio" /></label>
        <label className="field span-2">Skills / Technologies<input placeholder="React, Figma, SQL, Python" /></label>
        <label className="field span-2">Projects<input placeholder="Portfolio, dashboard, API, app links" /></label>
        <button type="button" className="primary-button span-2">Save Profile</button>
      </form>
    </Page>
  );
}

function Notifications() {
  return (
    <Page>
      <Panel title="Notifications">
        {notifications.map(([title, body, status]) => <Notice key={body} title={title} body={body} status={status} />)}
      </Panel>
    </Page>
  );
}

function Chat() {
  return (
    <Page>
      <section className="chat-shell">
        <aside>{people.map((person) => <MiniPerson key={person.name} person={person} />)}</aside>
        <div className="chat-window">
          <div className="chat-top"><strong>Rudra</strong><span>Online</span></div>
          <div className="messages">
            <p className="bubble incoming">Hey Rudra, want to pair on React components today?</p>
            <p className="bubble outgoing">Yes. I can review your UI and you can show me Python scripts after.</p>
          </div>
          <div className="chat-input"><input placeholder="Write a message" /><button className="primary-button"><Send size={17} /></button></div>
        </div>
      </section>
    </Page>
  );
}

function AdminDashboard() {
  return (
    <Page>
      <section className="metric-grid">
        <Metric icon={UsersRound} value="2,846" label="Total users" />
        <Metric icon={ClipboardList} value="318" label="Active requests" />
        <Metric icon={MessageCircle} value="8,420" label="Posts count" />
        <Metric icon={ChartNoAxesCombined} value="74%" label="Match success" />
      </section>
      <div className="dashboard-grid">
        <Panel title="Most popular skills" wide><BarChart /></Panel>
        <Panel title="Moderation queue">
          <Notice title="3 reports open" body="Two posts and one profile need review." status="Unread" />
          <Notice title="Growth spike" body="Signups up 18% this week." status="Read" />
        </Panel>
      </div>
    </Page>
  );
}

function UserManagement() {
  const rows = [
    ["Karan Vishwakarma", "karan@dtu.edu", "Student", "Active"],
    ["Rudra Patel", "rudra@srm.edu", "Student", "Active"],
    ["BharathRaj", "bharathraj@srm.edu", "Student", "Active"],
    ["Thirandra Ganesh", "ganesh@srm.edu", "Student", "Active"],
    ["Admin Team", "admin@peerlift.app", "Admin", "Active"]
  ];
  return <AdminTable title="Users" rows={rows} actions={["Ban", "Remove"]} />;
}

function PostModeration() {
  const rows = [
    ["Reported post #142", "Spam link in comments", "Feed", "Open"],
    ["Reported post #119", "Off-topic promotion", "Feed", "Review"],
    ["Reported post #103", "Resolved by moderator", "Feed", "Closed"]
  ];
  return <AdminTable title="Reported posts" rows={rows} actions={["Delete", "Dismiss"]} />;
}

function AdminTable({ title, rows, actions }) {
  return (
    <Page>
      <Panel title={title}>
        <div className="admin-search"><Search size={17} /><input placeholder={`Search ${title.toLowerCase()}`} /></div>
        <div className="table-list">
          {rows.map((row) => (
            <div className="table-row admin-row" key={row[0]}>
              {row.map((cell) => <span key={cell}>{cell}</span>)}
              <div className="row-actions">{actions.map((action) => <button key={action}>{action}</button>)}</div>
            </div>
          ))}
        </div>
      </Panel>
    </Page>
  );
}

function Page({ children }) {
  return <main className="page">{children}</main>;
}

function Stat({ value, label }) {
  return <div><strong>{value}</strong><span>{label}</span></div>;
}

function Metric({ icon: Icon, value, label }) {
  return <article className="metric-card"><Icon size={22} /><strong>{value}</strong><span>{label}</span></article>;
}

function Panel({ title, action, children, wide }) {
  return <section className={`panel ${wide ? "wide" : ""}`}><header><h2>{title}</h2>{action && <button>{action}</button>}</header>{children}</section>;
}

function MiniPerson({ person }) {
  return (
    <div className="mini-person">
      <InitialAvatar name={person.name} />
      <div><strong>{person.name}</strong><span>{person.skills?.slice(0, 2).join(" - ")}</span></div>
      <span className={`status-dot ${person.status}`} />
    </div>
  );
}

function Notice({ title, body, status }) {
  return <article className={`notice ${status === "Unread" ? "unread" : ""}`}><Bell size={18} /><div><strong>{title}</strong><p>{body}</p></div><span>{status}</span></article>;
}

function Quick({ to, icon: Icon, label }) {
  return <Link className="quick-action" to={to}><Icon size={20} /><span>{label}</span></Link>;
}

function MatchCard({ person }) {
  return (
    <article className="match-card">
      <div className="match-head">
        <InitialAvatar name={person.name} />
        <div><h3>{person.name}</h3><p>{person.username} - {person.college}</p></div>
        <strong>{person.match}%</strong>
      </div>
      <p>{person.bio}</p>
      <div className="tag-cloud">{person.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
      <div className="match-meta"><span>{person.level}</span><span>Wants {person.wants}</span></div>
      <div className="card-actions"><button className="primary-button"><UserRoundPlus size={17} /> Connect</button><button>View Profile</button><button>Chat</button></div>
    </article>
  );
}

function PostCard({ post, liked, onLike, compact }) {
  return (
    <article className={`post-card ${compact ? "compact" : ""}`}>
      <header>
        <InitialAvatar name={post.author.name} />
        <div><strong>{post.author.name}</strong><span>{post.author.username} - {post.time}</span></div>
        <button><MoreHorizontal size={18} /></button>
      </header>
      <p>{post.text}</p>
      <div className="tag-cloud">{post.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
      {!compact && <footer><button onClick={onLike} className={liked ? "liked" : ""}><Heart size={18} /> {post.likes + (liked ? 1 : 0)}</button><button><MessageCircle size={18} /> Comment</button></footer>}
    </article>
  );
}

function InitialAvatar({ name, className = "" }) {
  const initials = name
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

function BarChart() {
  return (
    <div className="bar-chart">
      {[
        ["React", 88],
        ["Python", 74],
        ["Figma", 62],
        ["DSA", 58],
        ["SQL", 46]
      ].map(([label, value]) => <div key={label}><span>{label}</span><i style={{ width: `${value}%` }} /><strong>{value}%</strong></div>)}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
