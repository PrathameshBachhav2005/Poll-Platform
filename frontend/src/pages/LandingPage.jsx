import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  motion, useScroll, useSpring, useMotionValue, useTransform,
  animate, AnimatePresence, useInView,
} from "motion/react";
import {
  Zap, BarChart3, Users, Globe, Lock, Bell,
  ArrowRight, Check, ChevronRight, Sparkles,
} from "lucide-react";

const C = { ink: "#0d0d0d", paper: "#f5f0e8", blaze: "#ff4d1c", volt: "#e8ff00" };

/* ── helpers ─────────────────────────────────────────────── */
const bs = (n = 4) => `${n}px ${n}px 0 ${C.ink}`;
const font = (w = 700, s = "0.9rem") => ({
  fontFamily: "'Space Grotesk', sans-serif", fontWeight: w, fontSize: s,
});

/* ── Reveal ──────────────────────────────────────────────── */
function Reveal({ children, delay = 0, style = {} }) {
  return (
    <motion.div style={style}
      initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

/* ── Animated counter ────────────────────────────────────── */
function Stat({ value, suffix = "", label }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState("0");
  useEffect(() => {
    if (!inView) return;
    const c = animate(mv, value, {
      duration: 1.8, ease: "easeOut",
      onUpdate: v => setDisplay(Math.round(v).toLocaleString()),
    });
    return c.stop;
  }, [inView, mv, value]);
  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <span style={{ ...font(800, "clamp(2rem,5vw,3rem)"), color: C.blaze, lineHeight: 1 }}>
        {display}{suffix}
      </span>
      <span style={{ fontSize: "0.8rem", fontWeight: 600, color: C.ink, opacity: 0.55, marginTop: 4 }}>
        {label}
      </span>
    </div>
  );
}

/* ── Scroll progress ─────────────────────────────────────── */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
  return (
    <motion.div style={{
      position: "fixed", top: 0, left: 0, right: 0, height: 4,
      background: C.blaze, transformOrigin: "0%", scaleX, zIndex: 9999,
    }} />
  );
}

/* ── Custom cursor ───────────────────────────────────────── */
function Cursor() {
  const x = useMotionValue(-100), y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 350, damping: 28 });
  const sy = useSpring(y, { stiffness: 350, damping: 28 });
  const [hov, setHov] = useState(false);
  useEffect(() => {
    const mv = e => { x.set(e.clientX); y.set(e.clientY); };
    const ov = e => { if (e.target.closest("a,button")) setHov(true); };
    const ou = () => setHov(false);
    window.addEventListener("mousemove", mv);
    window.addEventListener("mouseover", ov);
    window.addEventListener("mouseout", ou);
    return () => {
      window.removeEventListener("mousemove", mv);
      window.removeEventListener("mouseover", ov);
      window.removeEventListener("mouseout", ou);
    };
  }, [x, y]);
  return (
    <motion.div
      animate={{ width: hov ? 40 : 16, height: hov ? 40 : 16, rotate: hov ? 45 : 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      style={{
        position: "fixed", top: 0, left: 0,
        background: hov ? C.blaze : C.volt,
        border: `2px solid ${C.ink}`,
        pointerEvents: "none", zIndex: 99999,
        translateX: sx, translateY: sy,
        x: hov ? -20 : -8, y: hov ? -20 : -8,
        mixBlendMode: "multiply",
      }}
    />
  );
}

/* ── Marquee ─────────────────────────────────────────────── */
const CHIPS = [
  "⚡ Real-time Results","🔒 Private Polls","📊 Rich Analytics",
  "🌍 Global Reach","🎯 Targeted Audiences","🔔 Instant Alerts",
  "📱 Mobile First","🤝 Team Collaboration","🚀 Instant Deploy",
];
function Marquee() {
  const items = [...CHIPS, ...CHIPS];
  return (
    <div style={{ background: C.ink, borderTop: `2px solid ${C.ink}`, borderBottom: `2px solid ${C.ink}`, overflow: "hidden", padding: "14px 0" }}>
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
        style={{ display: "flex", whiteSpace: "nowrap", width: "max-content" }}>
        {items.map((chip, i) => (
          <React.Fragment key={i}>
            <span style={{ ...font(700, "0.88rem"), color: C.paper, padding: "0 28px", letterSpacing: "0.02em" }}>{chip}</span>
            <motion.span animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              style={{ color: C.volt, fontSize: "1rem", display: "inline-block", padding: "0 4px" }}>✦</motion.span>
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
}

/* ── Hero poll card ──────────────────────────────────────── */
const HERO_OPTS = [
  { label: "Dark Mode", base: 52 }, { label: "Light Mode", base: 28 },
  { label: "System Default", base: 14 }, { label: "High Contrast", base: 6 },
];
function HeroPollCard() {
  const [votes, setVotes] = useState(HERO_OPTS.map(o => o.base));
  const [liveCount, setLiveCount] = useState(1247);
  const [timeLeft, setTimeLeft] = useState(14 * 60 + 33);
  useEffect(() => {
    const iv = setInterval(() => {
      const idx = Math.floor(Math.random() * 4);
      setVotes(v => { const n = [...v]; n[idx] += Math.floor(Math.random() * 3) + 1; return n; });
      setLiveCount(c => c + Math.floor(Math.random() * 5) + 1);
    }, 1800);
    return () => clearInterval(iv);
  }, []);
  useEffect(() => {
    const iv = setInterval(() => setTimeLeft(t => t > 0 ? t - 1 : 0), 1000);
    return () => clearInterval(iv);
  }, []);
  const total = votes.reduce((a, b) => a + b, 0);
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotate: 2 }} animate={{ opacity: 1, y: 0, rotate: 2 }}
      transition={{ delay: 0.6, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      style={{ background: C.paper, border: `2px solid ${C.ink}`, boxShadow: bs(8), padding: "22px", width: "100%", maxWidth: 360, position: "relative" }}>
      <motion.div animate={{ rotate: [-6, -4, -6] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "absolute", top: -16, right: 16, background: C.blaze, color: C.paper, border: `2px solid ${C.ink}`, boxShadow: bs(3), padding: "4px 12px", ...font(800, "0.72rem"), letterSpacing: "0.05em" }}>
        ⚡ Updates live
      </motion.div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ ...font(800, "0.72rem"), textTransform: "uppercase", letterSpacing: "0.08em", color: C.ink, opacity: 0.45 }}>Live Poll</span>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <AnimatePresence mode="popLayout">
            <motion.span key={liveCount} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }} transition={{ duration: 0.22 }}
              style={{ ...font(800, "0.82rem"), color: C.blaze }}>{liveCount.toLocaleString()} votes</motion.span>
          </AnimatePresence>
          <span style={{ ...font(700, "0.78rem"), background: timeLeft < 60 ? C.blaze : C.volt, color: C.ink, border: `2px solid ${C.ink}`, padding: "2px 8px" }}>{mm}:{ss}</span>
        </div>
      </div>
      <p style={{ ...font(700, "0.95rem"), color: C.ink, marginBottom: 14 }}>What is your preferred UI theme?</p>
      {HERO_OPTS.map((opt, i) => {
        const pct = total > 0 ? Math.round((votes[i] / total) * 100) : 0;
        return (
          <div key={opt.label} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ ...font(600, "0.8rem"), color: C.ink }}>{opt.label}</span>
              <span style={{ ...font(700, "0.8rem"), color: C.blaze }}>{pct}%</span>
            </div>
            <div style={{ height: 9, background: "rgba(13,13,13,0.1)", border: `1.5px solid ${C.ink}`, overflow: "hidden" }}>
              <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                style={{ height: "100%", background: i === 0 ? C.blaze : i === 1 ? C.volt : C.ink }} />
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}

/* ── Latency bar ─────────────────────────────────────────── */
function LatencyBar() {
  const [bars, setBars] = useState([12, 18, 9, 22, 14, 8, 16, 11, 20, 7]);
  useEffect(() => {
    const iv = setInterval(() => setBars(p => [...p.slice(1), Math.floor(Math.random() * 20) + 5]), 900);
    return () => clearInterval(iv);
  }, []);
  const max = Math.max(...bars);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 56, marginTop: 20 }}>
      {bars.map((b, i) => (
        <motion.div key={i} animate={{ height: `${(b / max) * 100}%` }} transition={{ duration: 0.4, ease: "easeOut" }}
          style={{ flex: 1, background: C.paper, border: "1.5px solid rgba(245,240,232,0.35)" }} />
      ))}
    </div>
  );
}

/* ── Feature card ────────────────────────────────────────── */
function Feature({ icon: Icon, title, desc, bg = C.paper, colSpan = 1, rowSpan = 1, children }) {
  const tc = bg === C.blaze || bg === C.ink ? C.paper : C.ink;
  const sc = bg === C.blaze || bg === C.ink ? "rgba(245,240,232,0.7)" : "rgba(13,13,13,0.6)";
  return (
    <motion.div whileHover={{ y: -6, x: -2 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{ gridColumn: `span ${colSpan}`, gridRow: `span ${rowSpan}`, background: bg, border: `2px solid ${C.ink}`, boxShadow: bs(), padding: "26px", overflow: "hidden" }}>
      {Icon && <motion.div whileHover={{ rotate: 15 }} style={{ display: "inline-block", marginBottom: 14 }}><Icon size={30} color={tc} strokeWidth={2.5} /></motion.div>}
      <h3 style={{ ...font(800, "clamp(1rem,2vw,1.3rem)"), color: tc, marginBottom: 8 }}>{title}</h3>
      <p style={{ fontSize: "0.88rem", color: sc, lineHeight: 1.6 }}>{desc}</p>
      {children}
    </motion.div>
  );
}

/* ── Interactive poll ────────────────────────────────────── */
const POLL_OPTS = [
  { label: "🚀 PollFlow Pro", votes: 341 },
  { label: "📊 Analytics Suite", votes: 218 },
  { label: "🔒 Enterprise Plan", votes: 156 },
];
function InteractivePoll() {
  const [votes, setVotes] = useState(POLL_OPTS.map(o => o.votes));
  const [selected, setSelected] = useState(null);
  const handleVote = useCallback((idx) => {
    setVotes(prev => {
      const n = [...prev];
      if (selected !== null) n[selected] = Math.max(0, n[selected] - 1);
      n[idx] += 1;
      return n;
    });
    setSelected(idx);
  }, [selected]);
  const total = votes.reduce((a, b) => a + b, 0);
  return (
    <section style={{ background: C.volt, borderTop: `2px solid ${C.ink}`, borderBottom: `2px solid ${C.ink}`, padding: "90px 0" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 56, alignItems: "center" }}>
        <Reveal>
          <div>
            <span style={{ ...font(800, "0.72rem"), letterSpacing: "0.12em", textTransform: "uppercase", color: C.ink, opacity: 0.45 }}>Try it now</span>
            <h2 style={{ ...font(800, "clamp(1.8rem,4vw,2.8rem)"), color: C.ink, lineHeight: 1.1, margin: "10px 0 18px" }}>Feel the<br />difference.</h2>
            <p style={{ fontSize: "0.95rem", color: "rgba(13,13,13,0.65)", lineHeight: 1.7, marginBottom: 24 }}>
              Click an option. Watch the bars spring to life. Change your mind — we support that too.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[`${total} total votes`, "Live updates", "Change vote"].map(chip => (
                <span key={chip} style={{ ...font(700, "0.78rem"), background: C.ink, color: C.volt, border: `2px solid ${C.ink}`, padding: "5px 12px" }}>{chip}</span>
              ))}
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <div style={{ background: C.paper, border: `2px solid ${C.ink}`, boxShadow: bs(6), padding: "26px" }}>
            <p style={{ ...font(800, "1rem"), color: C.ink, marginBottom: 18 }}>Which PollFlow feature excites you most?</p>
            {POLL_OPTS.map((opt, i) => {
              const pct = total > 0 ? Math.round((votes[i] / total) * 100) : 0;
              return (
                <div key={opt.label} style={{ position: "relative", marginBottom: 10 }}>
                  <motion.button onClick={() => handleVote(i)} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    style={{ width: "100%", background: "transparent", border: `2px solid ${C.ink}`, boxShadow: bs(3), padding: "10px 14px", cursor: "pointer", position: "relative", overflow: "hidden", textAlign: "left", borderRadius: 0 }}>
                    <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                      style={{ position: "absolute", inset: 0, background: selected === i ? C.blaze : C.volt, opacity: selected === i ? 0.22 : 0.14, zIndex: 0 }} />
                    <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ ...font(700, "0.88rem"), color: C.ink }}>{opt.label}</span>
                      <span style={{ ...font(700, "0.82rem"), color: selected === i ? C.blaze : C.ink }}>{pct}% · {votes[i]}</span>
                    </div>
                  </motion.button>
                  <AnimatePresence>
                    {selected === i && (
                      <motion.div key="chk" initial={{ scale: 0, rotate: -90, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: C.blaze, border: `2px solid ${C.ink}`, width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 10 }}>
                        <Check size={12} color={C.paper} strokeWidth={3} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
            {selected !== null && (
              <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                style={{ ...font(600, "0.8rem"), color: C.blaze, marginTop: 6 }}>
                Vote recorded — click another to change it
              </motion.p>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Footer column ───────────────────────────────────────── */
function FooterCol({ title, links }) {
  return (
    <div>
      <p style={{ ...font(800, "0.72rem"), letterSpacing: "0.1em", textTransform: "uppercase", color: C.paper, opacity: 0.45, marginBottom: 14 }}>{title}</p>
      <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        {links.map(l => (
          <li key={l}>
            <motion.a href="#" whileHover={{ x: 4, color: C.volt }}
              style={{ color: C.paper, textDecoration: "none", fontSize: "0.92rem", display: "inline-block", transition: "color 0.2s" }}>{l}</motion.a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SECTION COMPONENTS
══════════════════════════════════════════════════════════ */

/* ── Nav ─────────────────────────────────────────────────── */
function LandingNav() {
  const [blink, setBlink] = useState(true);
  useEffect(() => { const iv = setInterval(() => setBlink(b => !b), 700); return () => clearInterval(iv); }, []);
  return (
    <motion.nav initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{ position: "sticky", top: 0, zIndex: 1000, background: C.paper, borderBottom: `2px solid ${C.ink}`, boxShadow: `0 2px 0 ${C.ink}` }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <motion.span animate={{ opacity: blink ? 1 : 0 }} transition={{ duration: 0.1 }}
            style={{ width: 10, height: 10, background: C.volt, border: `2px solid ${C.ink}`, display: "inline-block" }} />
          <span style={{ ...font(800, "1.3rem"), color: C.ink, letterSpacing: "-0.02em" }}>PollFlow</span>
        </Link>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {["Features", "Pricing", "Docs"].map(l => (
            <motion.a key={l} href="#" whileHover={{ y: -2 }}
              style={{ ...font(600, "0.9rem"), color: C.ink, textDecoration: "none", padding: "6px 14px" }}>{l}</motion.a>
          ))}
          <Link to="/register" style={{ textDecoration: "none", marginLeft: 8 }}>
            <motion.button whileHover={{ y: -2, x: -2, boxShadow: `6px 6px 0 ${C.ink}` }} whileTap={{ y: 2, x: 2, boxShadow: `2px 2px 0 ${C.ink}` }}
              style={{ ...font(800, "0.9rem"), background: C.ink, color: C.paper, border: `2px solid ${C.ink}`, boxShadow: `4px 4px 0 ${C.ink}`, padding: "8px 20px", cursor: "pointer" }}>
              Sign up free →
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}

/* ── Hero ────────────────────────────────────────────────── */
function Hero() {
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 600], [0, 120]);
  const WORDS = ["Polls", "that"];
  return (
    <section style={{ position: "relative", overflow: "hidden", minHeight: "92vh", display: "flex", alignItems: "center", padding: "80px 0" }}>
      <motion.div style={{ position: "absolute", inset: 0, y: bgY, backgroundImage: `linear-gradient(${C.ink}18 1px, transparent 1px), linear-gradient(90deg, ${C.ink}18 1px, transparent 1px)`, backgroundSize: "48px 48px", zIndex: 0 }} />
      <div style={{ position: "absolute", top: -120, right: -120, width: 500, height: 500, background: C.blaze, borderRadius: "50%", opacity: 0.07, zIndex: 0 }} />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 60, alignItems: "center" }}>
        <div>
          <Reveal>
            <motion.div whileHover={{ scale: 1.03 }}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.volt, border: `2px solid ${C.ink}`, boxShadow: `3px 3px 0 ${C.ink}`, padding: "6px 14px", marginBottom: 24 }}>
              <Sparkles size={14} color={C.ink} />
              <span style={{ ...font(700, "0.78rem"), letterSpacing: "0.08em", textTransform: "uppercase", color: C.ink }}>Real-time polling platform</span>
            </motion.div>
          </Reveal>
          <h1 style={{ ...font(800, "clamp(3rem,7vw,5.5rem)"), lineHeight: 1.0, letterSpacing: "-0.03em", color: C.ink, marginBottom: 24 }}>
            {WORDS.map((w, i) => (
              <motion.span key={w} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{ display: "inline-block", marginRight: "0.25em" }}>{w}</motion.span>
            ))}
            <br />
            <motion.span initial={{ opacity: 0, scale: 0.7, rotate: -6 }} animate={{ opacity: 1, scale: 1, rotate: -2 }} transition={{ delay: 0.35, duration: 0.5, type: "spring", stiffness: 300 }}
              style={{ display: "inline-block", background: C.blaze, color: C.paper, padding: "0 12px", marginRight: "0.25em", border: `2px solid ${C.ink}`, boxShadow: `4px 4px 0 ${C.ink}`, transform: "rotate(-2deg)" }}>
              punch
            </motion.span>
            <motion.span initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.5, ease: [0.22, 1, 0.36, 1] }} style={{ display: "inline-block" }}>back.</motion.span>
          </h1>
          <Reveal delay={0.5}>
            <p style={{ fontSize: "1.05rem", color: "rgba(13,13,13,0.65)", lineHeight: 1.7, maxWidth: 480, marginBottom: 36 }}>
              Launch polls in seconds. Watch results update live. Engage your audience like never before.
            </p>
          </Reveal>
          <Reveal delay={0.6}>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
              <Link to="/register" style={{ textDecoration: "none" }}>
                <motion.button whileHover={{ y: -3, x: -3, boxShadow: `7px 7px 0 ${C.ink}` }} whileTap={{ y: 2, x: 2, boxShadow: `2px 2px 0 ${C.ink}` }}
                  style={{ ...font(800, "1rem"), background: C.blaze, color: C.paper, border: `2px solid ${C.ink}`, boxShadow: `4px 4px 0 ${C.ink}`, padding: "14px 28px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                  Start for free <ArrowRight size={18} />
                </motion.button>
              </Link>
              <motion.a href="#features" whileHover={{ y: -2 }}
                style={{ ...font(700, "0.95rem"), color: C.ink, textDecoration: "none", display: "flex", alignItems: "center", gap: 6, borderBottom: `2px solid ${C.ink}`, paddingBottom: 2 }}>
                See how it works <ChevronRight size={16} />
              </motion.a>
            </div>
          </Reveal>
          <Reveal delay={0.75}>
            <div style={{ display: "flex", gap: 40, marginTop: 52, paddingTop: 32, borderTop: `2px solid ${C.ink}`, flexWrap: "wrap" }}>
              <Stat value={48000} suffix="+" label="Polls created" />
              <Stat value={2400000} suffix="+" label="Votes cast" />
              <Stat value={99.9} suffix="%" label="Uptime SLA" />
            </div>
          </Reveal>
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}><HeroPollCard /></div>
      </div>
    </section>
  );
}

/* ── Bento features ──────────────────────────────────────── */
function BentoFeatures() {
  return (
    <section id="features" style={{ padding: "100px 0", background: C.paper }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
        <Reveal>
          <div style={{ marginBottom: 48 }}>
            <span style={{ ...font(800, "0.75rem"), letterSpacing: "0.12em", textTransform: "uppercase", color: C.ink, opacity: 0.45 }}>Why PollFlow</span>
            <h2 style={{ ...font(800, "clamp(2rem,4vw,3rem)"), color: C.ink, lineHeight: 1.1, marginTop: 8 }}>Built for speed.<br />Designed to impress.</h2>
          </div>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gridAutoRows: "200px", gap: 12 }}>
          <Reveal delay={0} style={{ gridColumn: "span 3", gridRow: "span 2", display: "contents" }}>
            <Feature icon={Zap} title="Sub-50ms latency" desc="Results propagate to every connected client in under 50ms. Pure WebSocket magic." bg={C.blaze} colSpan={3} rowSpan={2}>
              <LatencyBar />
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, background: C.volt, border: `1.5px solid ${C.paper}`, display: "inline-block", borderRadius: "50%" }} />
                <span style={{ ...font(700, "0.75rem"), color: C.paper, opacity: 0.8 }}>Live latency monitor</span>
              </div>
            </Feature>
          </Reveal>
          <Reveal delay={0.1} style={{ gridColumn: "span 3", display: "contents" }}>
            <Feature icon={BarChart3} title="Rich Analytics" desc="Pie charts, bar graphs, and response heatmaps — all auto-generated." bg={C.volt} colSpan={3} rowSpan={1} />
          </Reveal>
          <Reveal delay={0.15} style={{ gridColumn: "span 3", display: "contents" }}>
            <Feature icon={Lock} title="Private and Secure" desc="JWT auth, rate limiting, and encrypted responses by default." bg={C.ink} colSpan={3} rowSpan={1}>
              <div style={{ marginTop: 8 }}>
                {["End-to-end encryption", "Rate limiting", "GDPR ready"].map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                    <Check size={12} color={C.volt} strokeWidth={3} />
                    <span style={{ ...font(600, "0.78rem"), color: C.paper, opacity: 0.8 }}>{f}</span>
                  </div>
                ))}
              </div>
            </Feature>
          </Reveal>
          <Reveal delay={0.2} style={{ gridColumn: "span 2", display: "contents" }}>
            <Feature icon={Globe} title="Global CDN" desc="Deployed across 30+ edge nodes. Your polls load fast everywhere." bg={C.paper} colSpan={2} rowSpan={1} />
          </Reveal>
          <Reveal delay={0.25} style={{ gridColumn: "span 2", display: "contents" }}>
            <Feature icon={Users} title="Team Workspaces" desc="Invite teammates, assign roles, and collaborate on polls together." bg={C.paper} colSpan={2} rowSpan={1} />
          </Reveal>
          <Reveal delay={0.3} style={{ gridColumn: "span 2", display: "contents" }}>
            <Feature icon={Bell} title="Smart Alerts" desc="Get notified when a poll hits a milestone or a result shifts." bg={C.paper} colSpan={2} rowSpan={1} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── Steps ───────────────────────────────────────────────── */
const STEPS = [
  { num: "01", title: "Create your poll", desc: "Pick a question, add up to 10 options, set a deadline. Done in under 60 seconds." },
  { num: "02", title: "Share the link", desc: "One URL. Works on any device. No app download, no account required for voters.", diamond: true },
  { num: "03", title: "Watch results live", desc: "Real-time bar charts update as votes roll in. Export to CSV or embed anywhere." },
];
function Steps() {
  return (
    <section style={{ padding: "100px 0", background: C.paper, borderTop: `2px solid ${C.ink}` }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span style={{ ...font(800, "0.75rem"), letterSpacing: "0.12em", textTransform: "uppercase", color: C.ink, opacity: 0.45 }}>How it works</span>
            <h2 style={{ ...font(800, "clamp(2rem,4vw,3rem)"), color: C.ink, lineHeight: 1.1, marginTop: 8 }}>Three steps.<br />Zero friction.</h2>
          </div>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {STEPS.map((step, i) => (
            <Reveal key={step.num} delay={i * 0.12}>
              <motion.div whileHover={{ y: -6, x: -2 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{ background: C.paper, border: `2px solid ${C.ink}`, boxShadow: bs(), padding: "32px", position: "relative" }}>
                <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 400, damping: 18, delay: i * 0.12 + 0.2 }}
                  style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, background: C.blaze, border: `2px solid ${C.ink}`, boxShadow: bs(3), ...font(800, "1.1rem"), color: C.paper, marginBottom: 20 }}>
                  {step.num}
                </motion.div>
                {step.diamond && (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    style={{ position: "absolute", top: 20, right: 20, width: 28, height: 28, background: C.blaze, border: `2px solid ${C.ink}` }} />
                )}
                <h3 style={{ ...font(800, "1.25rem"), color: C.ink, marginBottom: 12 }}>{step.title}</h3>
                <p style={{ fontSize: "0.95rem", color: "rgba(13,13,13,0.65)", lineHeight: 1.7 }}>{step.desc}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Pricing ─────────────────────────────────────────────── */
const PLANS = [
  { name: "Free", price: "$0", period: "forever", desc: "Perfect for trying things out.", features: ["5 polls / month", "100 responses / poll", "Basic analytics", "Public polls only"], cta: "Get started", bg: C.paper, featured: false },
  { name: "Pro", price: "$12", period: "/ month", desc: "For creators who mean business.", features: ["Unlimited polls", "10,000 responses / poll", "Advanced analytics", "Private polls", "Custom branding", "Priority support"], cta: "Start Pro trial", bg: C.blaze, featured: true },
  { name: "Team", price: "$48", period: "/ month", desc: "For teams that move fast together.", features: ["Everything in Pro", "Up to 10 seats", "Team workspaces", "SSO / SAML", "Audit logs", "Dedicated CSM"], cta: "Contact sales", bg: C.ink, featured: false },
];
function Pricing() {
  return (
    <section style={{ padding: "100px 0", background: C.paper, borderTop: `2px solid ${C.ink}` }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span style={{ ...font(800, "0.75rem"), letterSpacing: "0.12em", textTransform: "uppercase", color: C.ink, opacity: 0.45 }}>Pricing</span>
            <h2 style={{ ...font(800, "clamp(2rem,4vw,3rem)"), color: C.ink, lineHeight: 1.1, marginTop: 8 }}>Simple pricing.<br />No surprises.</h2>
          </div>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, alignItems: "end" }}>
          {PLANS.map((plan, i) => {
            const tc = plan.bg === C.ink || plan.bg === C.blaze ? C.paper : C.ink;
            const sc = plan.bg === C.ink ? "rgba(245,240,232,0.6)" : "rgba(13,13,13,0.5)";
            const btnBg = plan.bg === C.blaze ? C.paper : plan.bg === C.ink ? C.volt : C.ink;
            const btnColor = plan.bg === C.blaze ? C.blaze : plan.bg === C.ink ? C.ink : C.paper;
            const btnBorder = plan.bg === C.ink ? C.volt : C.ink;
            return (
              <Reveal key={plan.name} delay={i * 0.1}>
                <motion.div whileHover={{ y: plan.featured ? -12 : -6, x: -2 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  style={{ background: plan.bg, border: `2px solid ${C.ink}`, boxShadow: plan.featured ? bs(8) : bs(), padding: "36px 28px", position: "relative", transform: plan.featured ? "translateY(-16px)" : "none" }}>
                  {plan.featured && (
                    <motion.div animate={{ rotate: [-2, 2, -2] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      style={{ position: "absolute", top: -18, left: "50%", transform: "translateX(-50%)", background: C.volt, color: C.ink, border: `2px solid ${C.ink}`, boxShadow: bs(3), padding: "4px 14px", ...font(800, "0.75rem"), whiteSpace: "nowrap" }}>
                      Most picked
                    </motion.div>
                  )}
                  <p style={{ ...font(800, "0.8rem"), letterSpacing: "0.1em", textTransform: "uppercase", color: tc, opacity: 0.5, marginBottom: 8 }}>{plan.name}</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                    <span style={{ ...font(800, "clamp(2.5rem,5vw,3.5rem)"), color: tc, lineHeight: 1 }}>{plan.price}</span>
                    <span style={{ ...font(600, "0.9rem"), color: sc }}>{plan.period}</span>
                  </div>
                  <p style={{ fontSize: "0.9rem", color: sc, marginBottom: 24, lineHeight: 1.5 }}>{plan.desc}</p>
                  <ul style={{ listStyle: "none", padding: 0, marginBottom: 28 }}>
                    {plan.features.map((f, fi) => (
                      <motion.li key={f} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: fi * 0.06 + i * 0.1 }}
                        style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 20, height: 20, flexShrink: 0, background: plan.bg === C.blaze ? C.paper : plan.bg === C.ink ? C.volt : C.blaze, border: `1.5px solid ${plan.bg === C.ink ? C.volt : C.ink}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Check size={11} color={plan.bg === C.blaze ? C.blaze : plan.bg === C.ink ? C.ink : C.paper} strokeWidth={3} />
                        </div>
                        <span style={{ fontSize: "0.88rem", color: plan.bg === C.ink ? "rgba(245,240,232,0.85)" : "rgba(13,13,13,0.75)", fontWeight: 500 }}>{f}</span>
                      </motion.li>
                    ))}
                  </ul>
                  <Link to="/register" style={{ textDecoration: "none", display: "block" }}>
                    <motion.button whileHover={{ y: -2, x: -2, boxShadow: `6px 6px 0 ${btnBorder}` }} whileTap={{ y: 2, x: 2, boxShadow: `2px 2px 0 ${btnBorder}` }}
                      style={{ width: "100%", ...font(800, "0.95rem"), background: btnBg, color: btnColor, border: `2px solid ${btnBorder}`, boxShadow: `4px 4px 0 ${btnBorder}`, padding: "12px 20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      {plan.cta} <ArrowRight size={16} />
                    </motion.button>
                  </Link>
                </motion.div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Footer ──────────────────────────────────────────────── */
function Footer() {
  const [blink, setBlink] = useState(true);
  useEffect(() => { const iv = setInterval(() => setBlink(b => !b), 900); return () => clearInterval(iv); }, []);
  const marqueeText = Array(8).fill("Vote Loud  PollFlow ✦").join("  ");
  return (
    <footer style={{ background: C.ink, borderTop: `2px solid ${C.ink}` }}>
      <div style={{ borderBottom: "1px solid rgba(245,240,232,0.12)", overflow: "hidden", padding: "20px 0" }}>
        <motion.div animate={{ x: ["0%", "-50%"] }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          style={{ display: "flex", whiteSpace: "nowrap", width: "max-content" }}>
          {[...Array(2)].map((_, i) => (
            <span key={i} style={{ ...font(800, "clamp(1.8rem,4vw,3rem)"), color: C.paper, opacity: 0.07, padding: "0 40px", letterSpacing: "-0.02em" }}>{marqueeText}</span>
          ))}
        </motion.div>
      </div>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 24px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 40, marginBottom: 60 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <motion.span animate={{ opacity: blink ? 1 : 0 }} transition={{ duration: 0.1 }}
                style={{ width: 10, height: 10, background: C.blaze, border: `2px solid ${C.paper}`, display: "inline-block" }} />
              <span style={{ ...font(800, "1.2rem"), color: C.paper }}>PollFlow</span>
            </div>
            <p style={{ fontSize: "0.88rem", color: "rgba(245,240,232,0.5)", lineHeight: 1.7, maxWidth: 200 }}>
              The real-time polling platform built for speed, clarity, and impact.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 20 }}>
              <motion.span animate={{ opacity: blink ? 1 : 0.3 }}
                style={{ width: 8, height: 8, background: C.blaze, borderRadius: "50%", display: "inline-block" }} />
              <span style={{ ...font(600, "0.78rem"), color: "rgba(245,240,232,0.5)" }}>All systems operational</span>
            </div>
          </div>
          <FooterCol title="Product" links={["Features", "Pricing", "Changelog", "Roadmap"]} />
          <FooterCol title="Company" links={["About", "Blog", "Careers", "Press"]} />
          <FooterCol title="Legal" links={["Privacy", "Terms", "Security", "GDPR"]} />
        </div>
        <div style={{ borderTop: "1px solid rgba(245,240,232,0.1)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span style={{ ...font(600, "0.82rem"), color: "rgba(245,240,232,0.35)" }}>2026 PollFlow Inc. All rights reserved.</span>
          <div style={{ display: "flex", gap: 20 }}>
            {["Twitter", "GitHub", "Discord"].map(s => (
              <motion.a key={s} href="#" whileHover={{ x: 4, color: C.volt }}
                style={{ ...font(600, "0.82rem"), color: "rgba(245,240,232,0.35)", textDecoration: "none" }}>{s}</motion.a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ══════════════════════════════════════════════════════════
   DEFAULT EXPORT
══════════════════════════════════════════════════════════ */
export default function LandingPage() {
  useEffect(() => {
    document.body.style.background = C.paper;
    document.body.style.color = C.ink;
    return () => { document.body.style.background = ""; document.body.style.color = ""; };
  }, []);
  return (
    <div style={{ background: C.paper, color: C.ink, overflowX: "hidden" }}>
      <ScrollProgress />
      <Cursor />
      <LandingNav />
      <Hero />
      <Marquee />
      <BentoFeatures />
      <InteractivePoll />
      <Steps />
      <Pricing />
      <Footer />
    </div>
  );
}
