import { useEffect, useState, useContext, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { AuthContext } from "../context/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { io } from "socket.io-client";
import { Activity, Clock, BarChart3, Plus, Copy, Check, Trash2, AlertCircle, Pencil } from "lucide-react";

const C = { ink: "#0d0d0d", paper: "#f5f0e8", blaze: "#ff4d1c", volt: "#e8ff00" };
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL
  || 'https://poll-platform-backend.vercel.app';

/* ── Re-render tick every 30 s so cards move between Active/Expired in real time ── */
function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(iv);
  }, [intervalMs]);
  return now;
}

function Reveal({ children, delay = 0 }) {
  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
      transition={{ duration:0.45, delay, ease:[0.22,1,0.36,1] }}>
      {children}
    </motion.div>
  );
}

function PollCard({ poll, index, onDelete, now }) {
  const isExpired = now > new Date(poll.expiresAt).getTime();
  const [copied,        setCopied]        = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/poll/${poll._id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      await api.delete(`/polls/${poll._id}`);
      onDelete(poll._id);
    } catch (err) {
      console.error("Delete failed:", err);
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <Reveal delay={index * 0.06}>
      <motion.div whileHover={{ y:-5, x:-2 }} transition={{ type:"spring", stiffness:300, damping:20 }}
        style={{ background:C.paper, border:`2px solid ${C.ink}`, boxShadow:`4px 4px 0 ${C.ink}`, padding:"22px", display:"flex", flexDirection:"column", gap:14, height:"100%" }}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
          <h3 style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:800, fontSize:"1rem", color:C.ink, lineHeight:1.3, flex:1 }}>
            {poll.title}
          </h3>
          <motion.span
            key={isExpired ? "exp" : "live"}
            initial={{ scale:0.7, opacity:0 }} animate={{ scale:1, opacity:1 }}
            style={{ flexShrink:0, fontFamily:"'Space Grotesk', sans-serif", fontWeight:800, fontSize:"0.68rem", letterSpacing:"0.08em", textTransform:"uppercase", background:isExpired ? C.ink : C.volt, color:isExpired ? C.paper : C.ink, border:`2px solid ${C.ink}`, padding:"3px 9px" }}>
            {isExpired ? "Expired" : "Live"}
          </motion.span>
        </div>

        <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
            <Clock size={12} color="rgba(13,13,13,0.45)" strokeWidth={2.5} />
            <span style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:600, fontSize:"0.75rem", color:"rgba(13,13,13,0.5)" }}>
              {new Date(poll.expiresAt).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })}
            </span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
            <BarChart3 size={12} color="rgba(13,13,13,0.45)" strokeWidth={2.5} />
            <span style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:600, fontSize:"0.75rem", color:"rgba(13,13,13,0.5)" }}>
              {poll.questions.length} question{poll.questions.length !== 1 ? "s" : ""}
            </span>
          </div>
          {poll.isPublished && (
            <span style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:700, fontSize:"0.68rem", background:C.blaze, color:C.paper, border:`1.5px solid ${C.ink}`, padding:"2px 8px" }}>
              Published
            </span>
          )}
        </div>

        <div style={{ display:"flex", gap:8, marginTop:"auto", flexWrap:"wrap" }}>
          <Link to={`/poll/${poll._id}/results`} style={{ textDecoration:"none", flex:1, minWidth:100 }}>
            <motion.button whileHover={{ y:-2, x:-2, boxShadow:`5px 5px 0 ${C.ink}` }} whileTap={{ y:1, x:1, boxShadow:`2px 2px 0 ${C.ink}` }}
              style={{ width:"100%", fontFamily:"'Space Grotesk', sans-serif", fontWeight:800, fontSize:"0.8rem", background:C.blaze, color:C.paper, border:`2px solid ${C.ink}`, boxShadow:`3px 3px 0 ${C.ink}`, padding:"8px 12px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
              <BarChart3 size={13} strokeWidth={2.5} /> Analytics
            </motion.button>
          </Link>
          <Link to={`/edit/${poll._id}`} style={{ textDecoration:"none" }}>
            <motion.button whileHover={{ y:-2, x:-2, boxShadow:`5px 5px 0 ${C.ink}` }} whileTap={{ y:1, x:1, boxShadow:`2px 2px 0 ${C.ink}` }}
              style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:800, fontSize:"0.8rem", background:C.volt, color:C.ink, border:`2px solid ${C.ink}`, boxShadow:`3px 3px 0 ${C.ink}`, padding:"8px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
              <Pencil size={13} strokeWidth={2.5} /> Edit
            </motion.button>
          </Link>
          <motion.button onClick={handleCopy} whileHover={{ y:-2, x:-2, boxShadow:`5px 5px 0 ${C.ink}` }} whileTap={{ y:1, x:1, boxShadow:`2px 2px 0 ${C.ink}` }}
            style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:800, fontSize:"0.8rem", background:copied ? C.volt : C.paper, color:C.ink, border:`2px solid ${C.ink}`, boxShadow:`3px 3px 0 ${C.ink}`, padding:"8px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:5, transition:"background 0.2s" }}>
            <AnimatePresence mode="wait">
              {copied
                ? <motion.span key="c" initial={{ scale:0 }} animate={{ scale:1 }} exit={{ scale:0 }}><Check size={14} strokeWidth={3} /></motion.span>
                : <motion.span key="cp" initial={{ scale:0 }} animate={{ scale:1 }} exit={{ scale:0 }}><Copy size={14} strokeWidth={2.5} /></motion.span>
              }
            </AnimatePresence>
          </motion.button>
          <motion.button onClick={handleDelete} disabled={deleting} whileHover={{ y:-2, x:-2, boxShadow:`5px 5px 0 ${C.ink}` }} whileTap={{ y:1, x:1, boxShadow:`2px 2px 0 ${C.ink}` }}
            style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:800, fontSize:"0.8rem", background:confirmDelete ? C.blaze : C.paper, color:confirmDelete ? C.paper : C.ink, border:`2px solid ${C.ink}`, boxShadow:`3px 3px 0 ${C.ink}`, padding:"8px 12px", cursor:deleting ? "not-allowed" : "pointer", display:"flex", alignItems:"center", gap:5, transition:"background 0.2s, color 0.2s" }}>
            {deleting
              ? <div style={{ width:14, height:14, border:`2px solid ${C.paper}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />
              : <Trash2 size={14} strokeWidth={2.5} />
            }
          </motion.button>
        </div>

        {confirmDelete && !deleting && (
          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }}
            style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:700, fontSize:"0.75rem", color:C.blaze, marginTop:-6 }}>
            Click delete again to confirm
          </motion.p>
        )}
      </motion.div>
    </Reveal>
  );
}

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [polls,   setPolls]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const now = useNow(30_000); // ticks every 30 s

  /* ── Fetch polls ── */
  useEffect(() => {
    api.get("/polls/my-polls")
      .then(res => setPolls(res.data))
      .catch(() => setError("Failed to load polls. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  /* ── Socket: listen for dashboard_poll_expired so we get instant update ── */
  useEffect(() => {
    if (!user?.id) return;
    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socket.emit("join_user_room", user.id);

    socket.on("dashboard_poll_expired", ({ pollId }) => {
      // Force a re-render — the useNow tick will recalculate active/expired
      // We also touch the polls array to ensure re-classification happens NOW
      setPolls(prev => prev.map(p => p._id === pollId ? { ...p, _expiredAt: Date.now() } : p));
    });

    return () => {
      socket.emit("leave_user_room", user.id);
      socket.disconnect();
    };
  }, [user?.id]);

  const handleDelete = (id) => setPolls(prev => prev.filter(p => p._id !== id));

  // Use the live `now` tick for classification
  const active  = polls.filter(p => now <= new Date(p.expiresAt).getTime());
  const expired = polls.filter(p => now >  new Date(p.expiresAt).getTime());

  return (
    <div style={{ minHeight:"80vh" }}>
      <Reveal>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:16, marginBottom:40 }}>
          <div>
            <span style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:800, fontSize:"0.72rem", letterSpacing:"0.12em", textTransform:"uppercase", color:C.ink, opacity:0.4 }}>Dashboard</span>
            <h1 style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:800, fontSize:"clamp(1.6rem,4vw,2.4rem)", color:C.ink, lineHeight:1.1, marginTop:6 }}>
              Hey, {user?.username || "there"} 👋
            </h1>
            <p style={{ fontSize:"0.92rem", color:"rgba(13,13,13,0.5)", marginTop:6 }}>
              {polls.length === 0 ? "Create your first poll to get started." : `${active.length} active poll${active.length !== 1 ? "s" : ""} running.`}
            </p>
          </div>
          <Link to="/create" style={{ textDecoration:"none" }}>
            <motion.button whileHover={{ y:-3, x:-3, boxShadow:`7px 7px 0 ${C.ink}` }} whileTap={{ y:2, x:2, boxShadow:`2px 2px 0 ${C.ink}` }}
              style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:800, fontSize:"0.92rem", background:C.ink, color:C.paper, border:`2px solid ${C.ink}`, boxShadow:`4px 4px 0 ${C.ink}`, padding:"11px 20px", cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
              <Plus size={18} strokeWidth={2.5} /> New Poll
            </motion.button>
          </Link>
        </div>
      </Reveal>

      {error && (
        <Reveal delay={0.05}>
          <div style={{ display:"flex", alignItems:"center", gap:10, background:C.blaze, border:`2px solid ${C.ink}`, boxShadow:`4px 4px 0 ${C.ink}`, padding:"12px 16px", marginBottom:28, fontFamily:"'Space Grotesk', sans-serif", fontWeight:700, fontSize:"0.88rem", color:C.paper }}>
            <AlertCircle size={16} strokeWidth={2.5} /> {error}
          </div>
        </Reveal>
      )}

      {polls.length > 0 && (
        <Reveal delay={0.05}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))", gap:10, marginBottom:40 }}>
            {[
              { label:"Total",     value:polls.length,                           bg:C.ink,   color:C.paper },
              { label:"Active",    value:active.length,                          bg:C.volt,  color:C.ink   },
              { label:"Expired",   value:expired.length,                         bg:C.paper, color:C.ink   },
              { label:"Published", value:polls.filter(p=>p.isPublished).length,  bg:C.blaze, color:C.paper },
            ].map(s => (
              <div key={s.label} style={{ background:s.bg, border:`2px solid ${C.ink}`, boxShadow:`3px 3px 0 ${C.ink}`, padding:"18px 20px" }}>
                <motion.div
                  key={s.value}
                  initial={{ scale:1.2, color: s.bg === C.volt ? "#006600" : s.color }}
                  animate={{ scale:1, color: s.color }}
                  transition={{ duration:0.4 }}
                  style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:800, fontSize:"2rem", lineHeight:1 }}>
                  {s.value}
                </motion.div>
                <div style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:700, fontSize:"0.7rem", letterSpacing:"0.08em", textTransform:"uppercase", color:s.color, opacity:0.6, marginTop:4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      )}

      {loading && (
        <div style={{ display:"flex", justifyContent:"center", padding:"80px 0" }}>
          <div style={{ width:32, height:32, border:`3px solid ${C.ink}`, borderTopColor:C.blaze, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
        </div>
      )}

      {!loading && !error && polls.length === 0 && (
        <Reveal delay={0.1}>
          <div style={{ background:C.paper, border:`2px solid ${C.ink}`, boxShadow:`6px 6px 0 ${C.ink}`, padding:"60px 40px", textAlign:"center" }}>
            <motion.div animate={{ y:[-4,4,-4] }} transition={{ duration:2.5, repeat:Infinity, ease:"easeInOut" }} style={{ display:"inline-block", marginBottom:20 }}>
              <Activity size={52} color={C.blaze} strokeWidth={1.5} />
            </motion.div>
            <h2 style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:800, fontSize:"1.5rem", color:C.ink, marginBottom:10 }}>No polls yet</h2>
            <p style={{ fontSize:"0.92rem", color:"rgba(13,13,13,0.5)", marginBottom:28 }}>Create your first poll and start gathering real-time feedback.</p>
            <Link to="/create" style={{ textDecoration:"none" }}>
              <motion.button whileHover={{ y:-3, x:-3, boxShadow:`7px 7px 0 ${C.ink}` }} whileTap={{ y:2, x:2, boxShadow:`2px 2px 0 ${C.ink}` }}
                style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:800, fontSize:"0.92rem", background:C.blaze, color:C.paper, border:`2px solid ${C.ink}`, boxShadow:`4px 4px 0 ${C.ink}`, padding:"12px 26px", cursor:"pointer", display:"inline-flex", alignItems:"center", gap:8 }}>
                <Plus size={18} /> Create your first poll
              </motion.button>
            </Link>
          </div>
        </Reveal>
      )}

      {/* Active polls */}
      <AnimatePresence>
        {!loading && active.length > 0 && (
          <motion.div key="active-section" initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ marginBottom:40 }}>
            <Reveal delay={0.08}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
                <h2 style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:800, fontSize:"1.05rem", color:C.ink }}>Active Polls</h2>
                <motion.span key={active.length} initial={{ scale:1.3 }} animate={{ scale:1 }} transition={{ type:"spring", stiffness:400 }}
                  style={{ background:C.volt, border:`2px solid ${C.ink}`, fontFamily:"'Space Grotesk', sans-serif", fontWeight:800, fontSize:"0.72rem", color:C.ink, padding:"2px 9px" }}>
                  {active.length}
                </motion.span>
              </div>
            </Reveal>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(290px, 1fr))", gap:14 }}>
              <AnimatePresence>
                {active.map((poll, i) => (
                  <motion.div key={poll._id} layout exit={{ opacity:0, scale:0.9, transition:{ duration:0.3 } }}>
                    <PollCard poll={poll} index={i} onDelete={handleDelete} now={now} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expired polls */}
      <AnimatePresence>
        {!loading && expired.length > 0 && (
          <motion.div key="expired-section" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.35 }}>
            <Reveal delay={0.12}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
                <h2 style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:800, fontSize:"1.05rem", color:C.ink, opacity:0.45 }}>Expired Polls</h2>
                <motion.span key={expired.length} initial={{ scale:1.3 }} animate={{ scale:1 }} transition={{ type:"spring", stiffness:400 }}
                  style={{ background:C.ink, border:`2px solid ${C.ink}`, fontFamily:"'Space Grotesk', sans-serif", fontWeight:800, fontSize:"0.72rem", color:C.paper, padding:"2px 9px" }}>
                  {expired.length}
                </motion.span>
              </div>
            </Reveal>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(290px, 1fr))", gap:14, opacity:0.65 }}>
              <AnimatePresence>
                {expired.map((poll, i) => (
                  <motion.div key={poll._id} layout initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.35 }}>
                    <PollCard poll={poll} index={i} onDelete={handleDelete} now={now} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
