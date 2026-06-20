import { useState, useEffect, useRef, useContext, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../utils/api";
import { AuthContext } from "../context/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { io } from "socket.io-client";
import { Clock, AlertCircle, CheckCircle, ArrowRight, Lock, BarChart3, TimerOff } from "lucide-react";

const C = { ink: "#0d0d0d", paper: "#f5f0e8", blaze: "#ff4d1c", volt: "#e8ff00" };
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

function msLeft(expiresAt) { return new Date(expiresAt) - Date.now(); }
function fmtCountdown(ms) {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}

function DeadlinePopup({ onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:9000, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={onClose}
        style={{ position:"absolute", inset:0, background:"rgba(13,13,13,0.65)", backdropFilter:"blur(3px)" }} />
      <motion.div
        initial={{ scale:0.7, opacity:0, rotate:-4 }} animate={{ scale:1, opacity:1, rotate:0 }} exit={{ scale:0.8, opacity:0 }}
        transition={{ type:"spring", stiffness:320, damping:22 }}
        style={{ position:"relative", zIndex:1, background:C.paper, border:`3px solid ${C.ink}`, boxShadow:`8px 8px 0 ${C.ink}`, padding:"44px 40px", maxWidth:440, width:"100%", textAlign:"center" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:6, background:C.blaze }} />
        <motion.div animate={{ rotate:[0,-8,8,-6,6,0] }} transition={{ duration:0.6, delay:0.2 }}
          style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:72, height:72, background:C.blaze, border:`3px solid ${C.ink}`, boxShadow:`4px 4px 0 ${C.ink}`, marginBottom:20 }}>
          <TimerOff size={36} color={C.paper} strokeWidth={2} />
        </motion.div>
        <h2 style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:800, fontSize:"1.6rem", color:C.ink, lineHeight:1.15, marginBottom:14 }}>
          The deadline is over.
        </h2>
        <p style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:700, fontSize:"1.05rem", color:C.blaze, marginBottom:8 }}>
          You are too late to vote.
        </p>
        <p style={{ fontSize:"0.9rem", color:"rgba(13,13,13,0.55)", lineHeight:1.6, marginBottom:32 }}>
          This poll is no longer accepting responses. The voting window has closed.
        </p>
        <motion.button onClick={onClose}
          whileHover={{ y:-3, x:-3, boxShadow:`7px 7px 0 ${C.ink}` }}
          whileTap={{ y:2, x:2, boxShadow:`2px 2px 0 ${C.ink}` }}
          style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:800, fontSize:"0.95rem", background:C.ink, color:C.paper, border:`2px solid ${C.ink}`, boxShadow:`4px 4px 0 ${C.ink}`, padding:"12px 28px", cursor:"pointer", display:"inline-flex", alignItems:"center" }}>
          Got it
        </motion.button>
      </motion.div>
    </div>
  );
}

function StatusScreen({ icon: Icon, iconColor, title, subtitle, children }) {
  return (
    <div style={{ minHeight:"70vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 24px" }}>
      <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, ease:[0.22,1,0.36,1] }}
        style={{ background:C.paper, border:`2px solid ${C.ink}`, boxShadow:`6px 6px 0 ${C.ink}`, padding:"48px 40px", maxWidth:480, width:"100%", textAlign:"center" }}>
        <motion.div animate={{ y:[-4,4,-4] }} transition={{ duration:2.5, repeat:Infinity, ease:"easeInOut" }} style={{ display:"inline-block", marginBottom:20 }}>
          <Icon size={56} color={iconColor} strokeWidth={1.5} />
        </motion.div>
        <h2 style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:800, fontSize:"1.7rem", color:C.ink, marginBottom:10 }}>{title}</h2>
        <p style={{ fontSize:"0.95rem", color:"rgba(13,13,13,0.55)", lineHeight:1.7, marginBottom:28 }}>{subtitle}</p>
        {children}
      </motion.div>
    </div>
  );
}

function BrutalBtn({ to, bg = C.ink, color = C.paper, onClick, children }) {
  const s = { fontFamily:"'Space Grotesk', sans-serif", fontWeight:800, fontSize:"0.9rem", background:bg, color, border:`2px solid ${C.ink}`, boxShadow:`3px 3px 0 ${C.ink}`, padding:"10px 22px", cursor:"pointer", display:"inline-flex", alignItems:"center", gap:6, textDecoration:"none" };
  if (to) return <Link to={to} style={s}>{children}</Link>;
  return (
    <motion.button onClick={onClick} whileHover={{ y:-2, x:-2, boxShadow:`5px 5px 0 ${C.ink}` }} whileTap={{ y:1, x:1, boxShadow:`2px 2px 0 ${C.ink}` }} style={s}>
      {children}
    </motion.button>
  );
}

export default function PollView() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);

  const [poll,       setPoll]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [answers,    setAnswers]    = useState([]);
  const [submitted,  setSubmitted]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitErr,  setSubmitErr]  = useState("");
  const [timeLeft,   setTimeLeft]   = useState(null);
  const [isExpired,  setIsExpired]  = useState(false);
  const [showPopup,  setShowPopup]  = useState(false);

  const popupShownRef = useRef(false);
  const timerRef      = useRef(null);

  useEffect(() => {
    api.get(`/polls/${id}`)
      .then(res => {
        setPoll(res.data);
        const ms = msLeft(res.data.expiresAt);
        setIsExpired(ms <= 0);
        setTimeLeft(ms);
      })
      .catch(() => setError("Poll not found or failed to load."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!poll || isExpired) return;
    timerRef.current = setInterval(() => {
      const ms = msLeft(poll.expiresAt);
      setTimeLeft(ms);
      if (ms <= 0) {
        clearInterval(timerRef.current);
        setIsExpired(true);
        if (!popupShownRef.current && !submitted) {
          popupShownRef.current = true;
          setShowPopup(true);
        }
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [poll, submitted, isExpired]);

  useEffect(() => {
    if (!id) return;
    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socket.emit("join_poll", id);
    socket.on("poll_expired", ({ pollId }) => {
      if (pollId !== id) return;
      clearInterval(timerRef.current);
      setTimeLeft(0);
      setIsExpired(true);
      if (!popupShownRef.current && !submitted) {
        popupShownRef.current = true;
        setShowPopup(true);
      }
    });
    return () => { socket.emit("leave_poll", id); socket.disconnect(); };
  }, [id, submitted]);

  const handleSelect = useCallback((qi, opt) => {
    if (isExpired) return;
    setAnswers(prev => [...prev.filter(a => a.questionIndex !== qi), { questionIndex: qi, selectedOption: opt }]);
  }, [isExpired]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isExpired || msLeft(poll.expiresAt) <= 0) {
      if (!popupShownRef.current) { popupShownRef.current = true; setShowPopup(true); }
      return;
    }
    setSubmitting(true); setSubmitErr("");
    try {
      await api.post(`/responses/${id}`, { answers });
      setSubmitted(true);
    } catch (err) {
      const msg = err.response?.data?.msg || "Failed to submit. Please try again.";
      if (err.response?.status === 410 || msg.toLowerCase().includes("deadline") || msg.toLowerCase().includes("too late")) {
        if (!popupShownRef.current) { popupShownRef.current = true; setShowPopup(true); }
        setIsExpired(true);
      } else {
        setSubmitErr(msg);
      }
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div style={{ minHeight:"70vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:36, height:36, border:`3px solid ${C.ink}`, borderTopColor:C.blaze, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
    </div>
  );

  if (error) return (
    <StatusScreen icon={AlertCircle} iconColor={C.blaze} title="Poll not found" subtitle={error}>
      <BrutalBtn to="/">Go home</BrutalBtn>
    </StatusScreen>
  );

  if (submitted) return (
    <StatusScreen icon={CheckCircle} iconColor={C.blaze} title="Vote recorded!" subtitle="Your response has been submitted. Thanks for participating.">
      <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
        {poll.isPublished && <BrutalBtn to={`/poll/${id}/results`} bg={C.blaze}><BarChart3 size={15} /> View Results</BrutalBtn>}
        <BrutalBtn to="/" bg={C.paper} color={C.ink}>Back to home</BrutalBtn>
      </div>
    </StatusScreen>
  );

  if (poll.isPublished && isExpired && !showPopup) return (
    <StatusScreen icon={BarChart3} iconColor={C.ink} title="Poll has ended" subtitle="The creator has published the final results.">
      <BrutalBtn to={`/poll/${id}/results`} bg={C.blaze}><BarChart3 size={15} /> View Results</BrutalBtn>
    </StatusScreen>
  );

  if (isExpired && !showPopup) return (
    <StatusScreen icon={TimerOff} iconColor={C.blaze} title="The deadline is over." subtitle="You are too late to vote. This poll is no longer accepting responses." />
  );

  if (!poll.isAnonymous && !user) return (
    <StatusScreen icon={Lock} iconColor={C.ink} title="Login required" subtitle="This poll requires authentication. Sign in or create a free account.">
      <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
        <BrutalBtn to="/login" bg={C.blaze}>Login</BrutalBtn>
        <BrutalBtn to="/register" bg={C.paper} color={C.ink}>Sign up free</BrutalBtn>
      </div>
    </StatusScreen>
  );

  const urgentMs   = 5 * 60 * 1000;
  const warningMs  = 30 * 60 * 1000;
  const isUrgent   = timeLeft !== null && timeLeft <= urgentMs && timeLeft > 0;
  const isWarning  = timeLeft !== null && timeLeft <= warningMs && timeLeft > urgentMs;
  const timerBg    = isUrgent ? "rgba(255,77,28,0.12)" : isWarning ? "rgba(232,255,0,0.3)" : "rgba(13,13,13,0.06)";
  const timerBorder = isUrgent ? C.blaze : "rgba(245,240,232,0.2)";
  const timerTextColor = isUrgent ? C.blaze : "rgba(245,240,232,0.7)";
  const answeredCount = answers.length;

  return (
    <>
      <AnimatePresence>
        {showPopup && <DeadlinePopup onClose={() => setShowPopup(false)} />}
      </AnimatePresence>

      <div style={{ maxWidth:700, margin:"0 auto" }}>
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, ease:[0.22,1,0.36,1] }}
          style={{ background:C.ink, border:`2px solid ${C.ink}`, boxShadow:`5px 5px 0 ${C.blaze}`, padding:"26px 30px", marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, flexWrap:"wrap" }}>
            <div>
              <span style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:800, fontSize:"0.68rem", letterSpacing:"0.1em", textTransform:"uppercase", color:C.paper, opacity:0.4 }}>Live Poll</span>
              <h1 style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:800, fontSize:"clamp(1.2rem,3vw,1.7rem)", color:C.paper, lineHeight:1.2, marginTop:6 }}>{poll.title}</h1>
            </div>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8 }}>
              <motion.span animate={isUrgent ? { scale:[1,1.08,1] } : {}} transition={{ duration:0.8, repeat:Infinity }}
                style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:800, fontSize:"0.68rem", background:isUrgent ? C.blaze : C.volt, color:C.ink, border:`2px solid ${C.paper}`, padding:"3px 10px" }}>
                {isUrgent ? "Closing soon" : "Active"}
              </motion.span>
              {timeLeft !== null && (
                <motion.div animate={isUrgent ? { opacity:[1,0.6,1] } : {}} transition={{ duration:0.6, repeat:Infinity }}
                  style={{ display:"flex", alignItems:"center", gap:6, background:timerBg, border:`1.5px solid ${timerBorder}`, padding:"4px 10px" }}>
                  <Clock size={12} color={isUrgent ? C.blaze : "rgba(245,240,232,0.55)"} strokeWidth={2.5} />
                  <span style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:800, fontSize:"0.88rem", color:timerTextColor, letterSpacing:"0.04em" }}>
                    {fmtCountdown(timeLeft)}
                  </span>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.1 }}
          style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
          <div style={{ flex:1, height:6, background:"rgba(13,13,13,0.1)", border:`1.5px solid ${C.ink}`, overflow:"hidden" }}>
            <motion.div animate={{ width:`${poll.questions.length > 0 ? (answeredCount/poll.questions.length)*100 : 0}%` }} transition={{ duration:0.4 }}
              style={{ height:"100%", background:C.blaze }} />
          </div>
          <span style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:700, fontSize:"0.75rem", color:"rgba(13,13,13,0.45)", whiteSpace:"nowrap" }}>
            {answeredCount} / {poll.questions.length}
          </span>
        </motion.div>

        <AnimatePresence>
          {isUrgent && !isExpired && (
            <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
              style={{ display:"flex", alignItems:"center", gap:10, background:C.blaze, border:`2px solid ${C.ink}`, boxShadow:`3px 3px 0 ${C.ink}`, padding:"10px 14px", marginBottom:16, fontFamily:"'Space Grotesk', sans-serif", fontWeight:700, fontSize:"0.85rem", color:C.paper }}>
              <TimerOff size={15} strokeWidth={2.5} />
              Hurry! This poll closes in {fmtCountdown(timeLeft)}.
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {submitErr && (
            <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              style={{ display:"flex", alignItems:"center", gap:10, background:C.blaze, border:`2px solid ${C.ink}`, boxShadow:`3px 3px 0 ${C.ink}`, padding:"10px 14px", marginBottom:16, fontFamily:"'Space Grotesk', sans-serif", fontWeight:700, fontSize:"0.85rem", color:C.paper }}>
              <AlertCircle size={15} strokeWidth={2.5} /> {submitErr}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit}>
          {poll.questions.map((q, qi) => {
            const currentAnswer = answers.find(a => a.questionIndex === qi)?.selectedOption;
            return (
              <motion.div key={qi} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:qi*0.07+0.15, duration:0.4, ease:[0.22,1,0.36,1] }}
                style={{ background:C.paper, border:`2px solid ${C.ink}`, boxShadow:`4px 4px 0 ${C.ink}`, padding:"22px", marginBottom:14, opacity:isExpired ? 0.5 : 1, pointerEvents:isExpired ? "none" : "auto", transition:"opacity 0.4s" }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:18 }}>
                  <div style={{ width:26, height:26, background:currentAnswer ? C.blaze : C.paper, border:`2px solid ${C.ink}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"background 0.2s" }}>
                    <span style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:800, fontSize:"0.68rem", color:currentAnswer ? C.paper : C.ink }}>{String(qi+1).padStart(2,"0")}</span>
                  </div>
                  <h3 style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:700, fontSize:"0.98rem", color:C.ink, lineHeight:1.4, paddingTop:3 }}>
                    {q.text}{q.isMandatory && <span style={{ color:C.blaze, marginLeft:4 }}>*</span>}
                  </h3>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {q.options.map((opt, oi) => {
                    const selected = currentAnswer === opt;
                    return (
                      <motion.label key={oi} whileHover={!isExpired ? { x:3 } : {}} whileTap={!isExpired ? { scale:0.99 } : {}}
                        style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 14px", cursor:isExpired ? "not-allowed" : "pointer", border:`2px solid ${selected ? C.blaze : C.ink}`, boxShadow:selected ? `3px 3px 0 ${C.blaze}` : `3px 3px 0 ${C.ink}`, background:selected ? "rgba(255,77,28,0.07)" : C.paper, transition:"border-color 0.15s, box-shadow 0.15s, background 0.15s" }}>
                        <input type="radio" name={`q-${qi}`} value={opt} checked={selected} onChange={() => handleSelect(qi, opt)} required={q.isMandatory} disabled={isExpired} style={{ display:"none" }} />
                        <div style={{ width:18, height:18, border:`2px solid ${selected ? C.blaze : C.ink}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, background:selected ? C.blaze : "transparent", transition:"all 0.15s" }}>
                          {selected && <motion.div initial={{ scale:0 }} animate={{ scale:1 }} style={{ width:6, height:6, background:C.paper }} />}
                        </div>
                        <span style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:selected ? 700 : 600, fontSize:"0.9rem", color:selected ? C.blaze : C.ink, flex:1 }}>{opt}</span>
                        {selected && (
                          <motion.span initial={{ opacity:0, scale:0 }} animate={{ opacity:1, scale:1 }}
                            style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:800, fontSize:"0.65rem", background:C.blaze, color:C.paper, padding:"2px 8px", border:`1.5px solid ${C.ink}` }}>
                            Selected
                          </motion.span>
                        )}
                      </motion.label>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}

          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}
            style={{ display:"flex", justifyContent:"flex-end", marginTop:8 }}>
            <motion.button
              type={isExpired ? "button" : "submit"}
              disabled={submitting}
              onClick={isExpired ? () => { if (!popupShownRef.current) { popupShownRef.current = true; setShowPopup(true); } } : undefined}
              whileHover={!submitting && !isExpired ? { y:-3, x:-3, boxShadow:`7px 7px 0 ${C.ink}` } : {}}
              whileTap={!submitting && !isExpired ? { y:2, x:2, boxShadow:`2px 2px 0 ${C.ink}` } : {}}
              style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:800, fontSize:"0.95rem", background:isExpired ? "rgba(13,13,13,0.2)" : submitting ? "rgba(255,77,28,0.4)" : C.blaze, color:isExpired ? "rgba(13,13,13,0.4)" : C.paper, border:`2px solid ${C.ink}`, boxShadow:`4px 4px 0 ${C.ink}`, padding:"13px 30px", cursor:isExpired ? "not-allowed" : submitting ? "not-allowed" : "pointer", display:"flex", alignItems:"center", gap:8 }}>
              {submitting ? "Submitting" : isExpired ? "Voting closed" : "Submit Responses"}
              {!submitting && !isExpired && <ArrowRight size={17} />}
              {isExpired && <TimerOff size={16} />}
            </motion.button>
          </motion.div>
        </form>
      </div>
    </>
  );
}
