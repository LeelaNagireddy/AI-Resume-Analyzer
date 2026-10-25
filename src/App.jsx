import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutDashboard, FileSearch, MessagesSquare, Trophy, Users, Settings,
  LogOut, Bell, Search, ChevronDown, ArrowUpRight, ArrowRight, UploadCloud,
  FileText, CheckCircle2, AlertCircle, X, Sparkles, Target, Clock3, BookOpen,
  BrainCircuit, CircleHelp, Send, RotateCcw, Download, Trash2, Menu, ShieldCheck,
  TrendingUp, Award, Zap, BriefcaseBusiness, LockKeyhole, Eye, EyeOff, Plus,
  ClipboardCheck, BarChart3, UserRound, ChevronRight, Check, SlidersHorizontal
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth/mammoth.browser";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

const STORAGE = "careerpilot_v1";
const seed = {
  users: [
    { id: 1, name: "Aarav Sharma", email: "aarav@example.com", role: "Candidate", status: "Active", points: 940, ats: 82, interview: 86, assessments: 12 },
    { id: 2, name: "Diya Reddy", email: "diya@example.com", role: "Candidate", status: "Active", points: 890, ats: 78, interview: 82, assessments: 10 },
    { id: 3, name: "Rohan Patel", email: "rohan@example.com", role: "Candidate", status: "Active", points: 820, ats: 74, interview: 79, assessments: 9 },
    { id: 4, name: "Meera Nair", email: "meera@example.com", role: "Candidate", status: "Active", points: 760, ats: 80, interview: 72, assessments: 8 },
    { id: 5, name: "Ishaan Das", email: "ishaan@example.com", role: "Candidate", status: "Active", points: 710, ats: 68, interview: 75, assessments: 7 }
  ],
  sessions: [],
  analyses: [],
  currentUser: null
};
function readStore() {
  try { return { ...seed, ...JSON.parse(localStorage.getItem(STORAGE) || "{}") }; }
  catch { return { ...seed }; }
}
function writeStore(next) { localStorage.setItem(STORAGE, JSON.stringify(next)); }
const starterJD = "We are looking for a Junior Software Engineer with knowledge of JavaScript, React, HTML, CSS, REST APIs, Git, SQL, problem solving and communication. Experience building responsive web applications and debugging issues is preferred.";
const starterQuestions = [
  { skill: "JavaScript", level: "Foundational", q: "Explain the difference between `let`, `const`, and `var` in JavaScript.", rubric: ["scope", "reassignment", "hoisting"] },
  { skill: "React", level: "Intermediate", q: "How does React's state update process work, and when would you use `useEffect`?", rubric: ["state", "render", "side effect"] },
  { skill: "REST APIs", level: "Intermediate", q: "Describe how you would handle loading, success, and error states when calling a REST API.", rubric: ["fetch", "error", "loading"] },
  { skill: "Problem solving", level: "Foundational", q: "Tell me about a technical problem you solved. How did you investigate and verify the fix?", rubric: ["problem", "approach", "test"] },
  { skill: "SQL", level: "Advanced", q: "What is the difference between an INNER JOIN and a LEFT JOIN? Give a practical use case.", rubric: ["matching", "rows", "null"] }
];
const navCandidate = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, group: "WORKSPACE" },
  { id: "resume", label: "Resume Analyzer", icon: FileSearch, group: "PREPARATION" },
  { id: "interview", label: "Adaptive Interview", icon: MessagesSquare, group: "PREPARATION" },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy, group: "COMMUNITY" }
];
const navAdmin = [
  { id: "dashboard", label: "Overview", icon: LayoutDashboard, group: "ADMIN" },
  { id: "users", label: "Candidates", icon: Users, group: "MANAGEMENT" },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy, group: "MANAGEMENT" },
  { id: "settings", label: "Settings", icon: Settings, group: "SYSTEM" }
];
const knownSkills = [
  "JavaScript","TypeScript","Python","Java","C++","C#","React","Angular","Vue","Node.js","Express","HTML","CSS","Tailwind CSS","REST APIs","GraphQL","SQL","PostgreSQL","MongoDB","Git","Docker","AWS","Azure","Machine Learning","Deep Learning","NLP","TensorFlow","PyTorch","Pandas","NumPy","Data Analysis","Power BI","Excel","Communication","Problem solving","Teamwork","Leadership","Data Structures","Algorithms","OOP","FastAPI","Flask","Django","Figma","UI/UX","Testing","Jest","Agile"
];
const cx = (...a) => a.filter(Boolean).join(" ");
function initials(name = "Candidate") { return name.split(/\s+/).slice(0,2).map(x => x[0]).join("").toUpperCase(); }
function escapeHtml(s) { return s.replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])); }
function extractSkills(text) {
  const lower = text.toLowerCase();
  return knownSkills.filter(skill => {
    const escaped = skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9+#])${escaped}([^a-z0-9+#]|$)`, "i").test(lower);
  });
}
function calcAnalysis(resume, jd) {
  const resumeSkills = extractSkills(resume);
  const required = extractSkills(jd);
  const requiredUnique = required.length ? required : ["Communication", "Problem solving", "Git", "SQL"];
  const matched = requiredUnique.filter(s => resumeSkills.some(r => r.toLowerCase() === s.toLowerCase()));
  const missing = requiredUnique.filter(s => !matched.includes(s));
  const keywordScore = Math.round((matched.length / Math.max(requiredUnique.length, 1)) * 100);
  const resumeLengthScore = Math.min(100, Math.round(resume.trim().split(/\s+/).filter(Boolean).length / 4));
  const score = Math.max(12, Math.min(98, Math.round(keywordScore * 0.82 + resumeLengthScore * 0.18)));
  return { score, resumeSkills, required: requiredUnique, matched, missing, resumeWords: resume.trim().split(/\s+/).filter(Boolean).length, jdWords: jd.trim().split(/\s+/).filter(Boolean).length };
}
function evaluateAnswer(answer, question) {
  const text = answer.trim().toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const found = (question.rubric || []).filter(k => text.includes(k.toLowerCase()));
  const detail = Math.min(30, words.length * 1.5);
  const coverage = (found.length / Math.max(1, question.rubric.length)) * 50;
  const score = Math.max(8, Math.min(98, Math.round(detail + coverage + (words.length > 25 ? 12 : 0))));
  const feedback = score >= 75
    ? "Good coverage. You explained the core idea; add a concrete example to make the answer even stronger."
    : score >= 48
    ? "You have a useful starting point. Add more detail, define the key concept, and connect it to a practical example."
    : "Try structuring your answer in 2–4 clear points. Define the concept first, explain how it works, then give an example.";
  return { score, found, feedback };
}
function downloadFile(name, content, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}
function Pill({ children, tone = "neutral" }) { return <span className={`pill pill-${tone}`}>{children}</span>; }
function Progress({ value, color = "blue" }) { return <div className="progress"><span className={`progress-fill fill-${color}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>; }
function Avatar({ name, size = "md" }) { return <div className={`avatar avatar-${size}`}>{initials(name)}</div>; }
function EmptyState({ icon: Icon = FileText, title, body, action }) { return <div className="empty-state"><div className="empty-icon"><Icon size={23}/></div><h3>{title}</h3><p>{body}</p>{action}</div>; }

function Login({ onLogin }) {
  const [role, setRole] = useState("Candidate");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  function submit(e) {
    e.preventDefault(); setError("");
    if (!email.includes("@")) return setError("Enter a valid email address.");
    if (password.length < 4) return setError("Password must contain at least 4 characters.");
    const userName = name.trim() || email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    onLogin({ id: Date.now(), name: userName, email, role, status: "Active", points: 0, ats: 0, interview: 0, assessments: 0 });
  }
  return <div className="login-page">
    <div className="login-left">
      <div className="brand brand-light"><div className="brand-mark"><BrainCircuit size={21}/></div><span>career<span className="brand-accent">pilot</span></span></div>
      <div className="login-hero">
        <Pill tone="blue"><Sparkles size={12}/> YOUR CAREER, IN FOCUS</Pill>
        <h1>Prepare with purpose.<br/><span>Show up with confidence.</span></h1>
        <p>Your personal workspace to strengthen your resume, sharpen your skills, and prepare for the next opportunity.</p>
        <div className="hero-mini-stats">
          <div><strong>01</strong><span>Understand your gaps</span></div><div><strong>02</strong><span>Practice adaptively</span></div><div><strong>03</strong><span>Track your growth</span></div>
        </div>
      </div>
      <div className="login-footer">© 2026 CareerPilot · Built for your next step</div>
      <div className="decor decor-one"></div><div className="decor decor-two"></div>
    </div>
    <div className="login-right">
      <form className="login-card" onSubmit={submit}>
        <div className="mobile-brand brand"><div className="brand-mark"><BrainCircuit size={20}/></div><span>career<span className="brand-accent">pilot</span></span></div>
        <div className="login-heading"><Pill tone="green">WELCOME ABOARD</Pill><h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2><p>{mode === "login" ? "Enter your details to continue to your workspace." : "Start building your career readiness profile."}</p></div>
        <div className="role-select" aria-label="Choose account role">
          <button type="button" className={role === "Candidate" ? "role-option selected" : "role-option"} onClick={() => setRole("Candidate")}><UserRound size={17}/><span>Candidate</span>{role === "Candidate" && <Check size={15}/>}</button>
          <button type="button" className={role === "Admin" ? "role-option selected" : "role-option"} onClick={() => setRole("Admin")}><ShieldCheck size={17}/><span>Admin</span>{role === "Admin" && <Check size={15}/>}</button>
        </div>
        {mode === "signup" && <label className="field-label">Full name<input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Ananya Rao" required/></label>}
        <label className="field-label">Email address<input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email"/></label>
        <label className="field-label">Password<div className="password-wrap"><input className="input" type={showPassword ? "text" : "password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" required autoComplete={mode==="login"?"current-password":"new-password"}/><button className="icon-button password-toggle" type="button" onClick={()=>setShowPassword(!showPassword)} aria-label="Toggle password visibility">{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label>
        {error && <div className="form-error"><AlertCircle size={15}/>{error}</div>}
        <button className="btn btn-primary btn-full" type="submit">{mode === "login" ? "Sign in to workspace" : "Create account"}<ArrowRight size={17}/></button>
        <p className="switch-mode">{mode==="login" ? "New to CareerPilot?" : "Already have an account?"} <button type="button" onClick={()=>{setMode(mode==="login"?"signup":"login");setError("")}}>{mode==="login"?"Create an account":"Sign in"}</button></p>
        <div className="secure-note"><LockKeyhole size={13}/> Local prototype sign-in · connect backend auth for production</div>
      </form>
    </div>
  </div>;
}

function App() {
  const [store, setStore] = useState(readStore);
  const [page, setPage] = useState("dashboard");
  const [mobileNav, setMobileNav] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const user = store.currentUser;
  const nav = user?.role === "Admin" ? navAdmin : navCandidate;
  useEffect(() => { writeStore(store); }, [store]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(t);
  }, [toast]);
  function updateStore(patch) { setStore(prev => ({ ...prev, ...patch })); }
  function login(u) {
    const allUsers = [...store.users];
    const existing = allUsers.find(x => x.email.toLowerCase() === u.email.toLowerCase());
    if (existing) u = { ...existing, ...u, id: existing.id };
    else allUsers.push(u);
    setStore(prev => ({ ...prev, users: allUsers, currentUser: u }));
    setPage("dashboard");
  }
  function logout() { updateStore({ currentUser: null }); setPage("dashboard"); }
  function updateCurrentUser(patch) {
    const updated = { ...user, ...patch };
    updateStore({ currentUser: updated, users: store.users.map(u => u.id === user.id ? { ...u, ...patch } : u) });
  }
  if (!user) return <Login onLogin={login}/>;
  const currentName = user.name || "Candidate";
  return <div className="app-shell">
    <aside className={cx("sidebar", mobileNav && "sidebar-open")}>
      <div className="brand"><div className="brand-mark"><BrainCircuit size={21}/></div><span>career<span className="brand-accent">pilot</span></span></div>
      <div className="sidebar-profile"><Avatar name={currentName}/><div className="sidebar-profile-copy"><strong>{currentName}</strong><span>{user.role} workspace</span></div><ChevronDown size={14} className="muted"/></div>
      <nav className="side-nav">{nav.map((item, i) => <React.Fragment key={item.id}>{(i===0 || item.group!==nav[i-1].group) && <div className="nav-group">{item.group}</div>}<button className={cx("nav-item", page===item.id && "nav-active")} onClick={()=>{setPage(item.id);setMobileNav(false)}}><item.icon size={18}/><span>{item.label}</span>{page===item.id && <span className="nav-active-dot"/>}</button></React.Fragment>)}</nav>
      <div className="sidebar-bottom">
        <div className="sidebar-help"><div className="help-icon"><Sparkles size={17}/></div><strong>Keep moving forward</strong><p>Small practice sessions build lasting confidence.</p><button onClick={()=>{setPage(user.role==="Admin"?"users":"interview");setMobileNav(false)}}>Continue learning <ArrowRight size={13}/></button></div>
        <button className="nav-item logout-item" onClick={logout}><LogOut size={18}/><span>Sign out</span></button>
        <div className="sidebar-version">CAREERPILOT <span>v1.0</span></div>
      </div>
    </aside>
    {mobileNav && <button className="mobile-backdrop" onClick={()=>setMobileNav(false)} aria-label="Close navigation"/>}
    <main className="main-area">
      <header className="topbar">
        <button className="icon-button mobile-menu" onClick={()=>setMobileNav(!mobileNav)} aria-label="Toggle navigation"><Menu size={20}/></button>
        <div className="breadcrumb"><span>Workspace</span><ChevronRight size={14}/><strong>{pageTitle(page, user.role)}</strong></div>
        <div className="topbar-actions"><div className="top-search"><Search size={16}/><input placeholder="Search workspace..." value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){if(search.toLowerCase().includes("resume"))setPage("resume");else if(search.toLowerCase().includes("interview"))setPage("interview");else if(search.toLowerCase().includes("leader"))setPage("leaderboard");else if(search.toLowerCase().includes("candidate"))setPage("users");else setToast("Try searching for resume, interview, leaderboard, or candidates.");}}}/><kbd>↵</kbd></div>
          <div className="top-pop-wrap"><button className={cx("icon-button top-icon",notificationsOpen&&"icon-active")} onClick={()=>{setNotificationsOpen(!notificationsOpen);setProfileOpen(false)}} aria-label="Notifications"><Bell size={18}/><i/></button>{notificationsOpen&&<div className="popover"><div className="popover-title">Notifications</div><div className="notification"><span className="notification-dot"/><div><strong>Keep your profile updated</strong><p>A current resume helps improve your analysis.</p></div></div><div className="notification"><span className="notification-dot teal"/><div><strong>Practice makes progress</strong><p>Try a short interview session today.</p></div></div></div>}</div>
          <div className="top-pop-wrap"><button className="user-menu" onClick={()=>{setProfileOpen(!profileOpen);setNotificationsOpen(false)}}><Avatar name={currentName} size="sm"/><span className="user-menu-name">{currentName}</span><ChevronDown size={14}/></button>{profileOpen&&<div className="popover profile-popover"><div className="profile-pop-head"><Avatar name={currentName}/><div><strong>{currentName}</strong><p>{user.email}</p></div></div><button className="popover-action" onClick={()=>{setPage("settings");setProfileOpen(false)}}><Settings size={15}/> Settings</button><button className="popover-action" onClick={logout}><LogOut size={15}/> Sign out</button></div>}</div>
        </div>
      </header>
      <div className="page-content">
        {page === "dashboard" && (user.role==="Admin" ? <AdminDashboard store={store} setPage={setPage}/> : <CandidateDashboard user={user} store={store} setPage={setPage}/>)}
        {page === "resume" && user.role!=="Admin" && <ResumeAnalyzer store={store} user={user} onSave={(analysis)=>{const analyses=[analysis,...store.analyses.filter(a=>a.userId!==user.id)];updateStore({analyses});updateCurrentUser({ats:analysis.score});setToast("Resume analysis saved to your workspace.");}} setToast={setToast}/>}
        {page === "interview" && user.role!=="Admin" && <InterviewModule store={store} user={user} onFinish={(session)=>{const sessions=[session,...store.sessions];updateStore({sessions});updateCurrentUser({interview:session.score,points:(user.points||0)+session.score,assessments:(user.assessments||0)+1});setToast("Interview session saved. Your progress has been updated.");}} setToast={setToast}/>}
        {page === "leaderboard" && <Leaderboard store={store} user={user}/>}
        {page === "users" && user.role==="Admin" && <UsersPage store={store} setStore={updateStore} search={search} setToast={setToast}/>}
        {page === "settings" && <SettingsPage user={user} onSave={updateCurrentUser} setToast={setToast} onReset={()=>{localStorage.removeItem(STORAGE);setStore({...seed,currentUser:null});}}/>}
      </div>
      <footer className="page-footer"><span>© 2026 CareerPilot</span><span><span className="footer-dot"/> All changes saved locally</span><span>Built for career growth</span></footer>
    </main>
    {toast && <div className="toast"><CheckCircle2 size={18}/><span>{toast}</span><button onClick={()=>setToast("")}><X size={15}/></button></div>}
  </div>;
}
function pageTitle(page, role) {
  return ({dashboard:role==="Admin"?"Overview":"Dashboard",resume:"Resume Analyzer",interview:"Adaptive Interview",leaderboard:"Leaderboard",users:"Candidates",settings:"Settings"})[page]||"Dashboard";
}
function PageHeading({ eyebrow, title, description, action }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action&&<div className="heading-action">{action}</div>}</div>;
}
function MetricCard({ label, value, note, icon: Icon, tone = "blue", trend }) {
  return <div className="metric-card"><div className={`metric-icon metric-${tone}`}><Icon size={19}/></div><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-foot">{trend&&<span className="metric-trend"><TrendingUp size={13}/>{trend}</span>}<span>{note}</span></div></div>;
}
function CandidateDashboard({ user, store, setPage }) {
  const analysis = store.analyses.find(a=>a.userId===user.id);
  const sessions = store.sessions.filter(s=>s.userId===user.id);
  const latest = sessions[0];
  const ats = analysis?.score ?? user.ats ?? 0;
  const interview = latest?.score ?? user.interview ?? 0;
  const chartData = [
    {week:"W1", score:42},{week:"W2",score:54},{week:"W3",score:49},{week:"W4",score:67},{week:"W5",score:interview||62},{week:"W6",score:Math.min(100,interview?interview+4:70)}
  ];
  return <>
    <section className="welcome-banner"><div className="welcome-copy"><Pill tone="blue"><Sparkles size={12}/> YOUR CAREER WORKSPACE</Pill><h1>Welcome back, {user.name.split(" ")[0]}<span className="welcome-period">.</span></h1><p>Every practice session is progress. Let's make your next opportunity count.</p><div className="welcome-actions"><button className="btn btn-primary" onClick={()=>setPage("resume")}>Analyze my resume <ArrowRight size={16}/></button><button className="btn btn-ghost" onClick={()=>setPage("interview")}>Practice interview</button></div></div><div className="welcome-art"><div className="art-orbit orbit-a"/><div className="art-orbit orbit-b"/><div className="art-card art-card-main"><div className="art-card-top"><div className="art-card-icon"><Target size={18}/></div><span>Career readiness</span><Sparkles size={14}/></div><div className="art-score">{ats||"—"}<small>{ats?" / 100":"No score yet"}</small></div><div className="art-score-line"><span style={{width:`${ats}%`}}/></div><div className="art-card-bottom"><span><span className="tiny-dot teal-dot"/> Resume match</span><strong>{ats?`${ats}%`:"Start analysis"}</strong></div></div><div className="floating-check"><CheckCircle2 size={18}/><span>You're making progress</span></div><div className="floating-star"><Sparkles size={17}/></div></div></section>
    <div className="section-title-row"><div><h2>Your progress at a glance</h2><p>A quick snapshot of your preparation journey.</p></div><span className="subtle-label"><span className="live-dot"/> UPDATED JUST NOW</span></div>
    <div className="metric-grid">
      <MetricCard label="ATS compatibility" value={ats?`${ats}%`:"—"} note={analysis?"Latest resume analysis":"Analyze your resume to begin"} icon={FileSearch} tone="blue" trend={analysis?`${analysis.matched.length} skills matched`:null}/>
      <MetricCard label="Interview score" value={interview?`${interview}%`:"—"} note={latest?"Latest practice session":"Complete a mock interview"} icon={MessagesSquare} tone="purple" trend={latest?`${latest.questions.length} questions answered`:null}/>
      <MetricCard label="Questions answered" value={sessions.reduce((n,s)=>n+s.questions.length,0)} note="Across saved sessions" icon={ClipboardCheck} tone="teal"/>
      <MetricCard label="Growth points" value={user.points||0} note="Earned through practice" icon={Zap} tone="amber"/>
    </div>
    <div className="dashboard-grid">
      <section className="panel performance-panel"><div className="panel-header"><div><h3>Performance overview</h3><p>Your practice momentum over time</p></div><Pill tone="neutral">6 weeks</Pill></div><div className="chart-legend"><span><i className="legend-blue"/> Practice score</span><span className="chart-caption">Illustrative trend</span></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{top:8,right:8,left:-24,bottom:0}}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f6"/><XAxis dataKey="week" axisLine={false} tickLine={false} tick={{fill:"#9299aa",fontSize:12}}/><YAxis axisLine={false} tickLine={false} tick={{fill:"#9299aa",fontSize:11}} domain={[0,100]}/><Tooltip cursor={{fill:"#f4f6fb"}} contentStyle={{border:"1px solid #edf0f6",borderRadius:12,fontSize:12}}/><Bar dataKey="score" name="Score" fill="#4263d8" radius={[5,5,0,0]} maxBarSize={32}/></BarChart></ResponsiveContainer></div><div className="chart-footnote"><span><span className="tiny-dot blue-dot"/> Your scores will appear here as you complete sessions.</span></div></section>
      <section className="panel skills-panel"><div className="panel-header"><div><h3>Skill readiness</h3><p>Based on your latest resume analysis</p></div><button className="text-button" onClick={()=>setPage("resume")}>View report <ArrowUpRight size={14}/></button></div>{analysis ? <div className="skill-list">{analysis.required.slice(0,5).map(skill=><div className="skill-row" key={skill}><div className="skill-row-top"><span>{skill}</span><Pill tone={analysis.matched.includes(skill)?"green":"rose"}>{analysis.matched.includes(skill)?"Matched":"Gap"}</Pill></div><Progress value={analysis.matched.includes(skill)?85:18} color={analysis.matched.includes(skill)?"teal":"rose"}/></div>)}</div> : <EmptyState icon={Target} title="Your skill map starts here" body="Analyze a resume against a job description to see your matched skills and gaps." action={<button className="btn btn-secondary btn-sm" onClick={()=>setPage("resume")}>Start resume analysis <ArrowRight size={14}/></button>}/>}</section>
    </div>
    <section className="panel quick-actions-panel"><div className="panel-header"><div><h3>Your next best steps</h3><p>Keep your preparation moving with a focused action.</p></div></div><div className="quick-action-grid"><button className="quick-action" onClick={()=>setPage("resume")}><div className="quick-action-icon qa-blue"><FileSearch size={20}/></div><div><strong>Improve your resume</strong><p>Find skill gaps for your target role.</p><span>Analyze resume <ArrowRight size={13}/></span></div><ChevronRight size={17} className="quick-chevron"/></button><button className="quick-action" onClick={()=>setPage("interview")}><div className="quick-action-icon qa-purple"><BrainCircuit size={20}/></div><div><strong>Practice a mock interview</strong><p>Questions adapt as you answer.</p><span>Start practice <ArrowRight size={13}/></span></div><ChevronRight size={17} className="quick-chevron"/></button><button className="quick-action" onClick={()=>setPage("leaderboard")}><div className="quick-action-icon qa-amber"><Trophy size={20}/></div><div><strong>Check your ranking</strong><p>See how your practice is progressing.</p><span>View leaderboard <ArrowRight size={13}/></span></div><ChevronRight size={17} className="quick-chevron"/></button></div></section>
  </>;
}
function ResumeAnalyzer({ store, user, onSave, setToast }) {
  const [resumeText, setResumeText] = useState("");
  const [jd, setJd] = useState("");
  const [role, setRole] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileBusy, setFileBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const fileRef = useRef(null);
  const previous = store.analyses.find(a=>a.userId===user.id);
  async function parseFile(file) {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["pdf","docx","txt"].includes(ext)) { setError("Please upload a PDF, DOCX, or TXT resume."); return; }
    if (file.size > 10*1024*1024) { setError("File size must be less than 10 MB."); return; }
    setError(""); setFileBusy(true); setFileName(file.name);
    try {
      let text = "";
      if (ext === "pdf") {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const pdf = await pdfjsLib.getDocument({data:bytes}).promise;
        for (let i=1;i<=pdf.numPages;i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(item=>item.str).join(" ") + "\n";
        }
      } else if (ext === "docx") {
        const buffer = await file.arrayBuffer();
        const parsed = await mammoth.extractRawText({arrayBuffer:buffer});
        text = parsed.value;
      } else text = await file.text();
      if (!text.trim()) throw new Error("No readable text found. If this is a scanned PDF, OCR support is required.");
      setResumeText(text); setToast(`Extracted text from ${file.name}.`);
    } catch (e) { setError(e.message || "Could not read this file."); }
    finally { setFileBusy(false); }
  }
  function analyze(e) {
    e?.preventDefault(); setError("");
    if (resumeText.trim().length < 40) return setError("Please upload a resume or paste enough resume text (at least 40 characters).");
    if (jd.trim().length < 40) return setError("Please add a job description with at least 40 characters.");
    const data = calcAnalysis(resumeText, jd);
    const analysis = { ...data, id:Date.now(), userId:user.id, role:role||"Target role", createdAt:new Date().toISOString(), fileName:fileName||"Pasted resume", jd };
    setResult(analysis); onSave(analysis);
  }
  function exportReport() {
    if (!result) return;
    const report = `CAREERPILOT RESUME ANALYSIS\nRole: ${result.role}\nATS-style compatibility: ${result.score}/100\nMatched skills: ${result.matched.join(", ")||"None identified"}\nSkills to strengthen: ${result.missing.join(", ")||"No gaps detected"}\nResume words: ${result.resumeWords}\n\nNOTE: This score is a local, keyword-based estimate, not a validated ATS prediction.`;
    downloadFile("careerpilot-resume-report.txt", report);
  }
  return <>
    <PageHeading eyebrow="CAREER TOOLS" title="Resume Analyzer" description="Understand how your resume aligns with the role you want next." action={<Pill tone="blue"><Sparkles size={12}/> Skill-gap insights</Pill>}/>
    <div className="step-strip"><div className="step active"><span>1</span><div><strong>Add your resume</strong><small>PDF, DOCX or text</small></div></div><div className="step-line"/><div className={`step ${resumeText.trim()?"active":""}`}><span>2</span><div><strong>Add job description</strong><small>Target role details</small></div></div><div className="step-line"/><div className={`step ${result?"active":""}`}><span>3</span><div><strong>Review your report</strong><small>Match & skill gaps</small></div></div></div>
    <div className="analyzer-grid">
      <form className="panel analyzer-form" onSubmit={analyze}>
        <div className="panel-header"><div><h3>Resume and target role</h3><p>Both inputs are required for a useful comparison.</p></div><span className="required-note">* Required</span></div>
        <label className="field-label">Target job title<input className="input" value={role} onChange={e=>setRole(e.target.value)} placeholder="e.g. Frontend Developer"/></label>
        <div className="field-label">Your resume <span className="required-star">*</span><div className={cx("upload-zone",fileBusy&&"upload-busy")} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();parseFile(e.dataTransfer.files?.[0])}}><input ref={fileRef} type="file" accept=".pdf,.docx,.txt" hidden onChange={e=>parseFile(e.target.files?.[0])}/>{fileBusy?<div className="upload-content"><div className="upload-icon"><RotateCcw className="spin" size={22}/></div><strong>Reading your resume…</strong><span>Extracting document text locally</span></div>:fileName?<div className="uploaded-file"><div className="file-icon"><FileText size={22}/></div><div className="uploaded-file-copy"><strong>{fileName}</strong><span>{resumeText.length.toLocaleString()} characters extracted</span></div><button className="icon-button" type="button" onClick={()=>{setFileName("");setResumeText("");setResult(null)}} aria-label="Remove file"><Trash2 size={16}/></button></div>:<div className="upload-content"><div className="upload-icon"><UploadCloud size={24}/></div><strong>Drop your resume here, or <button className="inline-link" type="button" onClick={()=>fileRef.current?.click()}>browse files</button></strong><span>PDF, DOCX or TXT · Maximum 10 MB</span><span className="privacy-hint"><LockKeyhole size={12}/> Parsed in your browser</span></div>}</div></div>
        <label className="field-label">Resume text <span className="required-star">*</span><textarea className="textarea resume-textarea" value={resumeText} onChange={e=>setResumeText(e.target.value)} placeholder="Upload your resume to extract text automatically, or paste your resume content here…" rows={6}/><span className="field-hint">{resumeText.trim().split(/\s+/).filter(Boolean).length} words · Include skills, projects, education, and experience.</span></label>
        <label className="field-label">Job description <span className="required-star">*</span><textarea className="textarea" value={jd} onChange={e=>setJd(e.target.value)} placeholder="Paste the full job description, including required skills and responsibilities…" rows={7}/><span className="field-hint">Tip: include the responsibilities and required qualifications for better matching.</span></label>
        {error&&<div className="form-error"><AlertCircle size={15}/>{error}</div>}
        <button className="btn btn-primary btn-full" type="submit"><Sparkles size={16}/> Analyze resume <ArrowRight size={16}/></button>
        <p className="disclaimer"><LockKeyhole size={12}/> Your resume text stays in this browser in this frontend-only version.</p>
      </form>
      <div className="analysis-side">
        {result ? <AnalysisResult result={result} onExport={exportReport} onReset={()=>setResult(null)}/> : previous ? <div className="panel previous-analysis"><div className="panel-header"><div><h3>Last analysis</h3><p>Your latest saved resume report</p></div><Pill tone="green">Saved</Pill></div><div className="previous-score"><div className="score-ring" style={{"--score":`${previous.score}%`}}><div><strong>{previous.score}</strong><small>/100</small></div></div><div><strong>{previous.role}</strong><p>Analyzed {new Date(previous.createdAt).toLocaleDateString()}</p><Pill tone="blue">{previous.matched.length} matched skills</Pill></div></div><div className="mini-gap-list"><strong>Skills to strengthen</strong>{previous.missing.slice(0,5).map(s=><span key={s}><AlertCircle size={14}/>{s}</span>)}{!previous.missing.length&&<span><CheckCircle2 size={14}/>No obvious keyword gaps</span>}</div><button className="btn btn-secondary btn-full" onClick={()=>setResult(previous)}>Open saved report <ArrowRight size={15}/></button></div> : <div className="panel analysis-placeholder"><div className="placeholder-art"><div className="placeholder-sheet"><div className="sheet-head"><div/><span/><span/></div><div className="sheet-line long"/><div className="sheet-line"/><div className="sheet-line medium"/><div className="sheet-highlight"><CheckCircle2 size={15}/> Skill match detected</div><div className="sheet-line long"/><div className="sheet-line medium"/></div><div className="placeholder-magnify"><Search size={25}/></div><div className="placeholder-spark"><Sparkles size={18}/></div></div><h3>Your insights will appear here</h3><p>Upload your resume and add the job description. We'll compare skill mentions and highlight areas to strengthen.</p><div className="placeholder-benefits"><div><CheckCircle2 size={16}/><span>ATS-style keyword match</span></div><div><CheckCircle2 size={16}/><span>Matched and missing skills</span></div><div><CheckCircle2 size={16}/><span>Actionable next steps</span></div></div><div className="notice-box"><AlertCircle size={15}/><span>The current browser-only score uses keyword matching. Connect your NLP backend for semantic similarity and production-grade analysis.</span></div></div>}
      </div>
    </div>
  </>;
}
function AnalysisResult({result,onExport,onReset}) {
  const pie = [{name:"Matched",value:result.matched.length},{name:"Missing",value:result.missing.length}];
  return <div className="panel analysis-result"><div className="panel-header"><div><h3>Analysis report</h3><p>{result.role} · {new Date(result.createdAt).toLocaleDateString()}</p></div><button className="icon-button" onClick={onReset} title="New analysis"><Plus size={17}/></button></div><div className="result-score-block"><div className="score-ring score-ring-large" style={{"--score":`${result.score}%`}}><div><strong>{result.score}</strong><small>/100</small></div></div><div className="result-score-copy"><Pill tone={result.score>=75?"green":result.score>=50?"blue":"amber"}>{result.score>=75?"Strong keyword alignment":result.score>=50?"Room to improve":"Needs attention"}</Pill><h2>{result.score}% <span>match estimate</span></h2><p>Your resume includes {result.matched.length} of {result.required.length} identified job-related skills.</p></div></div><div className="result-stats"><div><span>Matched skills</span><strong className="text-green">{result.matched.length}</strong></div><div><span>Skill gaps</span><strong className="text-rose">{result.missing.length}</strong></div><div><span>Resume words</span><strong>{result.resumeWords}</strong></div></div><div className="result-section"><div className="result-section-heading"><h4>Skills in your resume</h4><Pill tone="green">{result.matched.length} found</Pill></div><div className="skill-chip-list">{result.matched.length?result.matched.map(s=><Pill tone="green" key={s}><Check size={12}/>{s}</Pill>):<span className="muted-small">No matching known skills found. Check your resume text.</span>}</div></div><div className="result-section"><div className="result-section-heading"><h4>Skills to strengthen</h4><Pill tone="rose">{result.missing.length} gaps</Pill></div>{result.missing.length?<div className="missing-skill-list">{result.missing.map((s,i)=><div className="missing-skill" key={s}><div className="missing-skill-icon"><Target size={15}/></div><div><strong>{s}</strong><p>{i<2?"Prioritize this skill in a project or practice exercise.":"Consider adding evidence of this skill if you have relevant experience."}</p></div><Pill tone="rose">Gap</Pill></div>)}</div>:<div className="success-note"><CheckCircle2 size={16}/> All identified job-description skills were also found in your resume text.</div>}</div><div className="recommendation-box"><div className="recommendation-icon"><Sparkles size={17}/></div><div><strong>Your next step</strong><p>{result.missing.length?`Focus on ${result.missing.slice(0,3).join(", ")}. If you have this experience, add concrete project or work examples to your resume.`:"Tailor your achievements to the role and quantify impact where possible."}</p></div></div><div className="notice-box"><AlertCircle size={15}/><span>This is an ATS-style keyword estimate, not a real ATS score or a guarantee of hiring outcomes. Semantic matching and robust skill extraction require a connected backend.</span></div><button className="btn btn-secondary btn-full" onClick={onExport}><Download size={16}/> Export report</button></div>;
}
function InterviewModule({store,user,onFinish,setToast}) {
  const [jd,setJd] = useState(starterJD);
  const [role,setRole] = useState("Junior Software Engineer");
  const [count,setCount] = useState("5");
  const [stage,setStage] = useState("setup");
  const [questions,setQuestions] = useState([]);
  const [index,setIndex] = useState(0);
  const [answer,setAnswer] = useState("");
  const [feedback,setFeedback] = useState(null);
  const [responses,setResponses] = useState([]);
  const [difficulty,setDifficulty] = useState("Foundational");
  const [sessionScore,setSessionScore] = useState(0);
  const [showHint,setShowHint] = useState(false);
  const [error,setError] = useState("");
  const analysis = store.analyses.find(a=>a.userId===user.id);
  function startInterview(e) {
    e.preventDefault(); setError("");
    if(jd.trim().length<30) return setError("Please add a more detailed job description.");
    const extracted = extractSkills(jd);
    const resumeGaps = analysis?.missing || [];
    const skillOrder = [...new Set([...resumeGaps,...extracted,...starterQuestions.map(q=>q.skill)])];
    const generated = skillOrder.slice(0,Number(count)).map((skill,i)=>{
      const template = starterQuestions.find(q=>q.skill.toLowerCase()===skill.toLowerCase()) || {
        skill, level:i<2?"Foundational":i<4?"Intermediate":"Advanced",
        q:`For a ${role} role, explain how you would apply ${skill} to solve a practical workplace problem.`,
        rubric:[skill.toLowerCase(),"example","problem"]
      };
      return {...template, id:`${Date.now()}-${i}`};
    });
    setQuestions(generated); setIndex(0); setAnswer(""); setFeedback(null); setResponses([]); setSessionScore(0); setDifficulty(generated[0]?.level||"Foundational"); setStage("active");
  }
  const current = questions[index];
  function submitAnswer(e) {
    e.preventDefault();
    if(answer.trim().length<8) {setError("Write at least a short sentence before submitting your answer.");return;}
    const evaluation=evaluateAnswer(answer,current);
    const response={question:current.q,skill:current.skill,level:difficulty,answer:answer.trim(),score:evaluation.score,feedback:evaluation.feedback};
    setFeedback({...evaluation,response}); setResponses(prev=>[...prev,response]); setSessionScore(Math.round((sessionScore*index+evaluation.score)/(index+1))); setError("");
  }
  function nextQuestion() {
    if(index+1>=questions.length) {
      const finalResponses=[...responses];
      const score=Math.round(finalResponses.reduce((n,r)=>n+r.score,0)/Math.max(1,finalResponses.length));
      const session={id:Date.now(),userId:user.id,role,score,questions:finalResponses,createdAt:new Date().toISOString(),difficulty};
      onFinish(session); setStage("summary"); return;
    }
    const currentScore=feedback.score;
    let nextDifficulty=currentScore>=78?"Advanced":currentScore>=52?"Intermediate":"Foundational";
    setDifficulty(nextDifficulty); setIndex(index+1); setAnswer(""); setFeedback(null); setShowHint(false);
  }
  function restart(){setStage("setup");setQuestions([]);setResponses([]);setFeedback(null);setAnswer("");}
  if(stage==="setup") return <>
    <PageHeading eyebrow="PRACTICE STUDIO" title="Adaptive Interview" description="Practice role-specific questions that respond to how you answer." action={<Pill tone="purple"><BrainCircuit size={12}/> Response-driven practice</Pill>}/>
    <div className="interview-setup-grid"><form className="panel interview-setup" onSubmit={startInterview}><div className="panel-header"><div><h3>Build your practice session</h3><p>Choose a target role and tailor the interview context.</p></div><div className="setup-step-icon"><MessagesSquare size={20}/></div></div><label className="field-label">Target job title<input className="input" value={role} onChange={e=>setRole(e.target.value)} placeholder="e.g. Data Analyst" required/></label><label className="field-label">Job description<textarea className="textarea" rows={8} value={jd} onChange={e=>setJd(e.target.value)} placeholder="Paste the job description to generate role-specific questions…" required/></label><div className="field-label">Number of questions<div className="choice-row">{["3","5","8"].map(n=><button type="button" key={n} className={cx("choice-button",count===n&&"choice-selected")} onClick={()=>setCount(n)}>{n} questions</button>)}</div></div>{analysis&&<div className="context-banner"><Sparkles size={16}/><div><strong>Resume insights connected</strong><p>Your latest resume skill gaps will be prioritized when building this session.</p></div></div>}{error&&<div className="form-error"><AlertCircle size={15}/>{error}</div>}<button className="btn btn-primary btn-full" type="submit"><BrainCircuit size={17}/> Start interview <ArrowRight size={16}/></button><p className="disclaimer"><Clock3 size={12}/> About {Number(count)*2}–{Number(count)*4} minutes · Text-based practice</p></form><div className="interview-overview-column"><div className="panel interview-how"><div className="how-illustration"><div className="how-orbit"/><div className="how-center"><BrainCircuit size={31}/></div><div className="how-node node-one"><Target size={16}/></div><div className="how-node node-two"><MessagesSquare size={16}/></div><div className="how-node node-three"><TrendingUp size={16}/></div></div><h3>Practice that adapts to you</h3><p>Answer one question at a time. Your response guides the next question's difficulty and focus.</p><div className="how-step"><span>01</span><div><strong>Get a tailored question</strong><p>Based on the role and skills.</p></div></div><div className="how-step"><span>02</span><div><strong>Answer in your own words</strong><p>Explain your reasoning clearly.</p></div></div><div className="how-step"><span>03</span><div><strong>Get feedback and adapt</strong><p>See a score and a next-step tip.</p></div></div></div><div className="panel session-history"><div className="panel-header"><div><h3>Recent practice</h3><p>Your saved interview sessions</p></div></div>{store.sessions.filter(s=>s.userId===user.id).slice(0,3).length?store.sessions.filter(s=>s.userId===user.id).slice(0,3).map(s=><div className="history-row" key={s.id}><div className="history-icon"><MessagesSquare size={16}/></div><div className="history-copy"><strong>{s.role}</strong><span>{new Date(s.createdAt).toLocaleDateString()} · {s.questions.length} questions</span></div><strong className="history-score">{s.score}%</strong></div>):<p className="muted-small">Your completed sessions will show up here.</p>}</div></div></div>
  </>;
  if(stage==="summary") return <div className="interview-summary"><div className="summary-success-icon"><Award size={30}/></div><Pill tone="green">SESSION COMPLETE</Pill><h1>Nice work, {user.name.split(" ")[0]}!</h1><p>You completed your {role} practice session. Review your results and decide what to focus on next.</p><div className="summary-score-ring"><div className="score-ring score-ring-large" style={{"--score":`${sessionScore}%`}}><div><strong>{sessionScore}</strong><small>/100</small></div></div></div><div className="summary-metrics"><div><strong>{responses.length}</strong><span>Questions answered</span></div><div><strong>{Math.round(responses.reduce((n,r)=>n+r.score,0)/Math.max(1,responses.length))}%</strong><span>Average response score</span></div><div><strong>{new Set(responses.map(r=>r.skill)).size}</strong><span>Skills practiced</span></div></div><div className="panel summary-feedback"><div className="panel-header"><div><h3>Answer review</h3><p>Use this feedback to guide your next practice session.</p></div><button className="btn btn-secondary btn-sm" onClick={()=>downloadFile("careerpilot-interview-report.txt",`CAREERPILOT INTERVIEW REPORT\nRole: ${role}\nScore: ${sessionScore}/100\n\n${responses.map((r,i)=>`${i+1}. ${r.skill} (${r.level})\nQ: ${r.question}\nYour answer: ${r.answer}\nScore: ${r.score}/100\nFeedback: ${r.feedback}`).join("\n\n")}`)}><Download size={14}/> Export</button></div>{responses.map((r,i)=><div className="answer-review" key={i}><div className="answer-review-top"><span>QUESTION {String(i+1).padStart(2,"0")}</span><Pill tone={r.score>=75?"green":r.score>=50?"amber":"rose"}>{r.score}/100</Pill></div><h4>{r.question}</h4><p className="review-answer">{r.answer}</p><div className="review-feedback"><Sparkles size={15}/><span>{r.feedback}</span></div></div>)}</div><div className="summary-actions"><button className="btn btn-primary" onClick={restart}><RotateCcw size={16}/> Start another session</button><button className="btn btn-secondary" onClick={()=>setToast("Your session is saved in this browser.")}>Done <Check size={16}/></button></div><div className="notice-box"><AlertCircle size={15}/><span>Answer scores are generated by local heuristic checks in this frontend. Connect an LLM evaluation service for semantic correctness and richer feedback.</span></div></div>;
  return <div className="interview-live"><div className="live-top"><button className="btn btn-ghost btn-sm" onClick={()=>{if(confirm("Leave this interview? Current unsaved answers will be lost."))restart()}}><X size={15}/> Exit session</button><div className="live-role"><span className="live-dot"/> {role}</div><span className="live-counter">QUESTION {index+1} OF {questions.length}</span></div><div className="live-progress"><span style={{width:`${((index+(feedback?1:0))/questions.length)*100}%`}}/></div><div className="live-layout"><div className="live-main"><div className="question-meta"><Pill tone="blue">{current.skill}</Pill><Pill tone={difficulty==="Advanced"?"rose":difficulty==="Intermediate"?"amber":"green"}>{difficulty}</Pill><span><Clock3 size={13}/> Take your time</span></div><div className="question-card"><div className="question-number">QUESTION {String(index+1).padStart(2,"0")}</div><h1>{current.q}</h1><p>Think out loud if it helps. A clear explanation and a practical example are more valuable than a perfect answer.</p><button className="text-button" onClick={()=>setShowHint(!showHint)}><CircleHelp size={15}/>{showHint?"Hide answer tips":"Need a hint?"}</button>{showHint&&<div className="hint-box"><strong>Try this structure</strong><p>Define the concept → explain how it works → give a real or hypothetical example → mention a trade-off or best practice.</p></div>}</div><form className="answer-form" onSubmit={submitAnswer}><label className="field-label">Your answer<textarea className="textarea answer-textarea" value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Write your answer here. Explain your thinking and include an example…" rows={8} disabled={!!feedback}/><span className="field-hint">{answer.trim().split(/\s+/).filter(Boolean).length} words · Aim for a clear, structured answer.</span></label>{error&&<div className="form-error"><AlertCircle size={15}/>{error}</div>}{!feedback?<button className="btn btn-primary btn-full" type="submit"><Send size={16}/> Submit answer <ArrowRight size={16}/></button>:<div className="feedback-panel"><div className="feedback-panel-head"><div className="feedback-check"><CheckCircle2 size={18}/></div><div><strong>Answer feedback</strong><p>Use this as a guide for your next response.</p></div><div className="feedback-score">{feedback.score}<small>/100</small></div></div><Progress value={feedback.score} color={feedback.score>=75?"teal":feedback.score>=50?"amber":"rose"}/><p>{feedback.feedback}</p><div className="feedback-keywords"><span>Concept cues</span>{current.rubric.map(k=><Pill tone={feedback.found.includes(k)?"green":"neutral"} key={k}>{feedback.found.includes(k)&&<Check size={10}/>} {k}</Pill>)}</div><button className="btn btn-primary btn-full" type="button" onClick={nextQuestion}>{index+1>=questions.length?"View session report":"Next question"} <ArrowRight size={16}/></button></div>}</form></div><aside className="live-sidebar"><div className="panel live-progress-panel"><h3>Session progress</h3><p>Stay focused, one question at a time.</p><div className="session-progress-number"><strong>{index+(feedback?1:0)}</strong><span>of {questions.length} completed</span></div><Progress value={((index+(feedback?1:0))/questions.length)*100}/><div className="question-nav-list">{questions.map((q,i)=><div className={cx("question-nav-item",i===index&&"question-current",responses[i]&&"question-done")} key={q.id}><span>{responses[i]?<Check size={13}/>:String(i+1).padStart(2,"0")}</span><div><strong>{q.skill}</strong><small>{responses[i]?`${responses[i].score}/100`:q.level}</small></div>{i===index&&!feedback&&<span className="current-marker"/>}</div>)}</div></div><div className="panel live-tip"><div className="live-tip-icon"><Sparkles size={16}/></div><strong>Interview tip</strong><p>Use a specific example whenever possible. Explain the situation, what you did, and the outcome.</p></div></aside></div></div>;
}
function Leaderboard({store,user}) {
  const [period,setPeriod]=useState("All time");
  const [sort,setSort]=useState("points");
  const rows=useMemo(()=>store.users.filter(u=>u.role!=="Admin").map(u=>({...u,points:u.points||0})).sort((a,b)=>sort==="interview"?(b.interview||0)-(a.interview||0):sort==="ats"?(b.ats||0)-(a.ats||0):(b.points||0)-(a.points||0)),[store.users,sort]);
  const me=rows.findIndex(u=>u.id===user.id||u.email===user.email);
  return <><PageHeading eyebrow="COMMUNITY" title="Leaderboard" description="Celebrate consistent practice and see how your skills are progressing." action={<Pill tone="amber"><Trophy size={12}/> Keep climbing</Pill>}/><div className="leaderboard-top-grid"><div className="panel leaderboard-intro"><div className="leaderboard-trophy"><Trophy size={28}/></div><div><Pill tone="blue">COMMUNITY RANKINGS</Pill><h2>Progress is worth celebrating.</h2><p>Rankings reflect saved practice activity in this browser. Keep learning and your points will grow.</p></div></div><div className="panel your-rank-card"><div className="your-rank-label">YOUR CURRENT RANK</div><div className="your-rank-value">{me>=0?`#${me+1}`:"—"}</div><div className="your-rank-user"><Avatar name={user.name}/><div><strong>{user.name}</strong><span>{user.points||0} points earned</span></div></div><div className="rank-progress-note"><TrendingUp size={14}/> Complete more practice sessions to climb the board.</div></div></div><section className="panel leaderboard-table-panel"><div className="panel-header"><div><h3>Candidate rankings</h3><p>{rows.length} candidate profiles in this workspace</p></div><div className="table-controls"><div className="select-wrap"><SlidersHorizontal size={14}/><select value={sort} onChange={e=>setSort(e.target.value)} aria-label="Sort leaderboard"><option value="points">Sort by points</option><option value="interview">Interview score</option><option value="ats">ATS score</option></select></div></div></div><div className="table-scroll"><table className="data-table leaderboard-table"><thead><tr><th>RANK</th><th>CANDIDATE</th><th>POINTS</th><th>ATS SCORE</th><th>INTERVIEW</th><th>ASSESSMENTS</th></tr></thead><tbody>{rows.map((r,i)=><tr className={r.id===user.id||r.email===user.email?"current-user-row":""} key={r.id}><td><div className={cx("rank-badge",i===0&&"rank-gold",i===1&&"rank-silver",i===2&&"rank-bronze")}>{i<3?<Award size={15}/>:i+1}</div></td><td><div className="table-user"><Avatar name={r.name} size="sm"/><div><strong>{r.name}{(r.id===user.id||r.email===user.email)&&<span className="you-label">YOU</span>}</strong><span>{r.email}</span></div></div></td><td><strong className="points-cell"><Zap size={14}/>{r.points||0}</strong></td><td><div className="table-progress-cell"><strong>{r.ats||0}%</strong><Progress value={r.ats||0}/></div></td><td><strong>{r.interview||0}%</strong></td><td>{r.assessments||0}</td></tr>)}</tbody></table></div><div className="table-footnote"><ShieldCheck size={14}/> Rankings are based on locally stored workspace data, not a shared live leaderboard.</div></section></>;
}
function AdminDashboard({store,setPage}) {
  const candidates=store.users.filter(u=>u.role!=="Admin");
  const average=arr=>arr.length?Math.round(arr.reduce((n,u)=>n+(u||0),0)/arr.length):0;
  return <><PageHeading eyebrow="ADMINISTRATION" title="Platform overview" description="A clear view of candidate activity and career-readiness progress." action={<Pill tone="purple"><ShieldCheck size={12}/> Admin access</Pill>}/><div className="metric-grid"><MetricCard label="Candidate profiles" value={candidates.length} note="Profiles stored in this browser" icon={Users} tone="blue"/><MetricCard label="Resume analyses" value={store.analyses.length} note="Saved analysis reports" icon={FileSearch} tone="teal"/><MetricCard label="Interview sessions" value={store.sessions.length} note="Completed practice sessions" icon={MessagesSquare} tone="purple"/><MetricCard label="Average interview score" value={`${average(candidates.map(u=>u.interview))}%`} note="Across candidate profiles" icon={BarChart3} tone="amber"/></div><div className="dashboard-grid admin-grid"><section className="panel"><div className="panel-header"><div><h3>Recent candidates</h3><p>Profiles in this local workspace</p></div><button className="text-button" onClick={()=>setPage("users")}>Manage candidates <ArrowRight size={14}/></button></div><div className="recent-user-list">{candidates.slice(0,5).map(u=><div className="recent-user" key={u.id}><Avatar name={u.name}/><div className="recent-user-info"><strong>{u.name}</strong><span>{u.email}</span></div><div className="recent-user-score"><strong>{u.interview||0}%</strong><span>Interview</span></div><Pill tone="green">{u.status||"Active"}</Pill></div>)}</div></section><section className="panel admin-activity"><div className="panel-header"><div><h3>Platform activity</h3><p>Saved records by module</p></div></div><div className="activity-stat"><div className="activity-icon ai-blue"><FileSearch size={17}/></div><div><strong>Resume analyses</strong><span>Candidate-to-role comparisons</span></div><strong>{store.analyses.length}</strong></div><div className="activity-stat"><div className="activity-icon ai-purple"><MessagesSquare size={17}/></div><div><strong>Interview sessions</strong><span>Completed practice reports</span></div><strong>{store.sessions.length}</strong></div><div className="activity-stat"><div className="activity-icon ai-teal"><Trophy size={17}/></div><div><strong>Leaderboard entries</strong><span>Candidate profiles with points</span></div><strong>{candidates.length}</strong></div><div className="notice-box"><AlertCircle size={15}/><span>This admin view only sees data stored in this browser. Connect a backend and database for shared platform-wide reporting.</span></div></section></div><section className="panel quick-actions-panel"><div className="panel-header"><div><h3>Admin shortcuts</h3><p>Common management tasks</p></div></div><div className="quick-action-grid"><button className="quick-action" onClick={()=>setPage("users")}><div className="quick-action-icon qa-blue"><Users size={20}/></div><div><strong>Manage candidates</strong><p>Review profiles and scores.</p><span>Open candidate list <ArrowRight size={13}/></span></div><ChevronRight size={17} className="quick-chevron"/></button><button className="quick-action" onClick={()=>setPage("leaderboard")}><div className="quick-action-icon qa-amber"><Trophy size={20}/></div><div><strong>Review rankings</strong><p>Compare candidate performance.</p><span>Open leaderboard <ArrowRight size={13}/></span></div><ChevronRight size={17} className="quick-chevron"/></button><button className="quick-action" onClick={()=>setPage("settings")}><div className="quick-action-icon qa-purple"><Settings size={20}/></div><div><strong>Workspace settings</strong><p>Update your profile and preferences.</p><span>Open settings <ArrowRight size={13}/></span></div><ChevronRight size={17} className="quick-chevron"/></button></div></section></>;
}
function UsersPage({store,setStore,search,setToast}) {
  const [filter,setFilter]=useState("All");
  const candidates=store.users.filter(u=>u.role!=="Admin").filter(u=>(filter==="All"||u.status===filter)&&`${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase()));
  function toggleStatus(u){setStore({...store,users:store.users.map(x=>x.id===u.id?{...x,status:x.status==="Active"?"Paused":"Active"}:x)});setToast(`${u.name}'s status updated.`);}
  return <><PageHeading eyebrow="CANDIDATE MANAGEMENT" title="Candidates" description="Review candidate profiles and their saved preparation metrics." action={<Pill tone="blue"><Users size={12}/>{candidates.length} profiles</Pill>}/><div className="metric-grid compact-metrics"><MetricCard label="Total candidates" value={store.users.filter(u=>u.role!=="Admin").length} note="Local workspace profiles" icon={Users} tone="blue"/><MetricCard label="Active profiles" value={store.users.filter(u=>u.role!=="Admin"&&u.status==="Active").length} note="Currently marked active" icon={CheckCircle2} tone="teal"/><MetricCard label="Saved analyses" value={store.analyses.length} note="Resume reports" icon={FileSearch} tone="purple"/><MetricCard label="Sessions completed" value={store.sessions.length} note="Interview practice" icon={MessagesSquare} tone="amber"/></div><section className="panel users-table-panel"><div className="panel-header"><div><h3>Candidate directory</h3><p>Search, review, and update local profile status.</p></div><div className="table-controls"><div className="filter-tabs">{["All","Active","Paused"].map(f=><button key={f} className={filter===f?"filter-tab selected":"filter-tab"} onClick={()=>setFilter(f)}>{f}</button>)}</div></div></div><div className="table-scroll"><table className="data-table"><thead><tr><th>CANDIDATE</th><th>STATUS</th><th>ATS SCORE</th><th>INTERVIEW</th><th>POINTS</th><th>ASSESSMENTS</th><th>ACTION</th></tr></thead><tbody>{candidates.map(u=><tr key={u.id}><td><div className="table-user"><Avatar name={u.name} size="sm"/><div><strong>{u.name}</strong><span>{u.email}</span></div></div></td><td><Pill tone={u.status==="Active"?"green":"neutral"}><span className="pill-dot"/>{u.status||"Active"}</Pill></td><td>{u.ats||0}%</td><td>{u.interview||0}%</td><td><strong>{u.points||0}</strong></td><td>{u.assessments||0}</td><td><button className="btn btn-table" onClick={()=>toggleStatus(u)}>{u.status==="Active"?"Pause":"Activate"}</button></td></tr>)}</tbody></table>{!candidates.length&&<EmptyState icon={Users} title="No candidates found" body="Try changing your search or status filter."/>}</div><div className="table-footnote"><AlertCircle size={14}/> Status changes are stored in local browser storage. Real account management requires backend permissions.</div></section></>;
}
function SettingsPage({user,onSave,setToast,onReset}) {
  const [name,setName]=useState(user.name||""); const [email,setEmail]=useState(user.email||""); const [role,setRole]=useState(user.role||"Candidate"); const [saved,setSaved]=useState(false);
  function save(e){e.preventDefault();if(!email.includes("@"))return;onSave({name:name.trim()||user.name,email,role});setSaved(true);setToast("Profile settings saved.");}
  return <><PageHeading eyebrow="PREFERENCES" title="Settings" description="Manage your workspace profile and local application data."/><div className="settings-grid"><form className="panel settings-panel" onSubmit={save}><div className="panel-header"><div><h3>Profile information</h3><p>These details appear in your workspace.</p></div><div className="settings-avatar"><Avatar name={name||user.name} size="lg"/></div></div><label className="field-label">Full name<input className="input" value={name} onChange={e=>setName(e.target.value)} required/></label><label className="field-label">Email address<input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label className="field-label">Workspace role<select className="input" value={role} onChange={e=>setRole(e.target.value)}><option>Candidate</option><option>Admin</option></select><span className="field-hint">Role selection is not secure authorization in this frontend-only version.</span></label><button className="btn btn-primary" type="submit"><Check size={16}/> Save changes</button>{saved&&<span className="save-confirm"><CheckCircle2 size={14}/> Saved</span>}</form><div className="settings-side"><div className="panel"><div className="panel-header"><div><h3>Application status</h3><p>Current frontend capabilities</p></div><Pill tone="amber">Local mode</Pill></div><div className="setting-status-row"><span>Resume parsing</span><Pill tone="green">Browser-based</Pill></div><div className="setting-status-row"><span>Session persistence</span><Pill tone="green">Local storage</Pill></div><div className="setting-status-row"><span>Authentication</span><Pill tone="rose">Backend needed</Pill></div><div className="setting-status-row"><span>AI evaluation</span><Pill tone="rose">Backend needed</Pill></div></div><div className="panel danger-zone"><div className="danger-title"><AlertCircle size={17}/><h3>Reset local workspace</h3></div><p>Remove the saved profile, analyses, and practice sessions from this browser. This action cannot be undone.</p><button className="btn btn-danger" onClick={()=>{if(confirm("Reset all CareerPilot local data in this browser?"))onReset()}}><Trash2 size={15}/> Reset local data</button></div></div></div></>;
}

export default App;
