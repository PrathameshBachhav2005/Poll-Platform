import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'motion/react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Share2, Users, Activity, Globe, Lock, ArrowUpRight, Check } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const C = { ink: '#0d0d0d', paper: '#f5f0e8', blaze: '#ff4d1c', volt: '#e8ff00' };

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL
  || 'https://poll-platform-backend.vercel.app';

const CHART_COLORS = [
  { bg: 'rgba(255,77,28,0.75)',  border: '#ff4d1c' },
  { bg: 'rgba(232,255,0,0.75)',  border: '#c8dd00' },
  { bg: 'rgba(13,13,13,0.65)',   border: '#0d0d0d' },
  { bg: 'rgba(255,77,28,0.4)',   border: '#ff4d1c' },
  { bg: 'rgba(232,255,0,0.4)',   border: '#c8dd00' },
];

function Reveal({ children, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value, bg = C.paper, color = C.ink, delay = 0 }) {
  return (
    <Reveal delay={delay}>
      <div style={{ background: bg, border: `2px solid ${C.ink}`, boxShadow: `4px 4px 0 ${C.ink}`, padding: '18px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Icon size={16} color={color} strokeWidth={2.5} />
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', color, opacity: 0.6 }}>{label}</span>
        </div>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '2rem', color, lineHeight: 1 }}>{value}</div>
      </div>
    </Reveal>
  );
}

function QuestionBreakdown({ question, qIndex, responses }) {
  const counts = new Array(question.options.length).fill(0);
  responses.forEach(r => {
    const ans = r.answers.find(a => a.questionIndex === qIndex);
    if (ans) {
      const oi = question.options.indexOf(ans.selectedOption);
      if (oi > -1) counts[oi]++;
    }
  });
  const total    = counts.reduce((a, b) => a + b, 0);
  const maxCount = Math.max(...counts, 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: qIndex * 0.07 + 0.2, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{ background: C.paper, border: `2px solid ${C.ink}`, boxShadow: `4px 4px 0 ${C.ink}`, padding: '22px' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 18 }}>
        <div style={{ width: 24, height: 24, background: C.blaze, border: `2px solid ${C.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.65rem', color: C.paper }}>{String(qIndex + 1).padStart(2, '0')}</span>
        </div>
        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.98rem', color: C.ink, lineHeight: 1.4 }}>{question.text}</h3>
      </div>

      {/* Horizontal bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {question.options.map((opt, oi) => {
          const pct      = total > 0 ? Math.round((counts[oi] / total) * 100) : 0;
          const isWinner = counts[oi] === maxCount && counts[oi] > 0;
          return (
            <div key={oi}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.85rem', color: C.ink }}>{opt}</span>
                  {isWinner && (
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.62rem', background: C.volt, color: C.ink, border: `1.5px solid ${C.ink}`, padding: '1px 7px' }}>LEADING</span>
                  )}
                </div>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.85rem', color: isWinner ? C.blaze : 'rgba(13,13,13,0.45)' }}>
                  {pct}% · {counts[oi]}
                </span>
              </div>
              <div style={{ height: 10, background: 'rgba(13,13,13,0.08)', border: `1.5px solid ${C.ink}`, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: oi * 0.05 + qIndex * 0.07 + 0.3, ease: [0.22, 1, 0.36, 1] }}
                  style={{ height: '100%', background: isWinner ? C.blaze : C.ink, opacity: isWinner ? 1 : 0.3 }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bar chart */}
      <div style={{ height: 150 }}>
        <Bar
          data={{
            labels: question.options,
            datasets: [{
              label: 'Votes',
              data: counts,
              backgroundColor: CHART_COLORS.map(c => c.bg),
              borderColor: CHART_COLORS.map(c => c.border),
              borderWidth: 2,
            }],
          }}
          options={{
            responsive: true, maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { backgroundColor: C.ink, titleColor: C.paper, bodyColor: C.paper, titleFont: { family: "'Space Grotesk', sans-serif", weight: '700' }, bodyFont: { family: "'Space Grotesk', sans-serif" } },
            },
            scales: {
              y: { ticks: { color: 'rgba(13,13,13,0.45)', stepSize: 1, font: { family: "'Space Grotesk', sans-serif", weight: '600', size: 10 } }, grid: { color: 'rgba(13,13,13,0.07)' }, border: { color: C.ink, width: 2 } },
              x: { ticks: { color: 'rgba(13,13,13,0.55)', font: { family: "'Space Grotesk', sans-serif", weight: '600', size: 10 } }, grid: { display: false }, border: { color: C.ink, width: 2 } },
            },
          }}
        />
      </div>
    </motion.div>
  );
}

export default function PollResults() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [poll,       setPoll]       = useState(null);
  const [responses,  setResponses]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [publishing, setPublishing] = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [liveFlash,  setLiveFlash]  = useState(false);

  useEffect(() => {
    Promise.all([api.get(`/polls/${id}`), api.get(`/responses/${id}`)])
      .then(([pollRes, statsRes]) => { setPoll(pollRes.data); setResponses(statsRes.data); })
      .catch(err => setError(err.response?.data?.msg || 'Error loading analytics'))
      .finally(() => setLoading(false));

    const socket = io(SOCKET_URL);
    socket.emit('join_poll', id);
    socket.on('new_response', (newRes) => {
      setResponses(prev => [...prev, newRes]);
      setLiveFlash(true);
      setTimeout(() => setLiveFlash(false), 900);
    });
    return () => { socket.emit('leave_poll', id); socket.disconnect(); };
  }, [id]);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await api.put(`/polls/${id}/publish`);
      setPoll(p => ({ ...p, isPublished: true }));
    } catch { alert('Failed to publish results'); }
    finally { setPublishing(false); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/poll/${id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Loading ── */
  if (loading) return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: `3px solid ${C.ink}`, borderTopColor: C.blaze, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: C.blaze, border: `2px solid ${C.ink}`, boxShadow: `4px 4px 0 ${C.ink}`, padding: '20px 28px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: C.paper }}>{error}</div>
    </div>
  );

  if (!poll) return null;

  const isCreator = user && poll.creator.toString() === user.id;
  const isExpired = new Date() > new Date(poll.expiresAt);

  /* ── Not published + not creator ── */
  if (!isCreator && !poll.isPublished) return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: C.paper, border: `2px solid ${C.ink}`, boxShadow: `6px 6px 0 ${C.ink}`, padding: '48px 40px', maxWidth: 440, textAlign: 'center' }}>
        <Lock size={48} color={C.ink} strokeWidth={1.5} style={{ marginBottom: 16 }} />
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '1.5rem', color: C.ink, marginBottom: 10 }}>Results not published</h2>
        <p style={{ fontSize: '0.92rem', color: 'rgba(13,13,13,0.5)' }}>The creator hasn't published the results yet.</p>
      </motion.div>
    </div>
  );

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <Reveal>
        <div style={{ background: C.ink, border: `2px solid ${C.ink}`, boxShadow: `5px 5px 0 ${C.blaze}`, padding: '26px 30px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: C.paper, opacity: 0.4 }}>Analytics</span>
              <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', color: C.paper, lineHeight: 1.2, marginTop: 6 }}>{poll.title}</h1>
              <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.7rem', background: isExpired ? 'rgba(245,240,232,0.12)' : C.volt, color: isExpired ? C.paper : C.ink, border: `1.5px solid ${isExpired ? 'rgba(245,240,232,0.25)' : C.volt}`, padding: '3px 10px' }}>
                  {isExpired ? 'Expired' : '● Live'}
                </span>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.7rem', background: poll.isPublished ? 'rgba(232,255,0,0.18)' : 'rgba(245,240,232,0.08)', color: poll.isPublished ? C.volt : 'rgba(245,240,232,0.45)', border: `1.5px solid ${poll.isPublished ? C.volt : 'rgba(245,240,232,0.18)'}`, padding: '3px 10px' }}>
                  {poll.isPublished ? 'Published' : 'Private'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <motion.button onClick={handleCopy}
                whileHover={{ y: -2, x: -2, boxShadow: `5px 5px 0 ${C.volt}` }}
                whileTap={{ y: 1, x: 1, boxShadow: `2px 2px 0 ${C.volt}` }}
                style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.8rem', background: 'transparent', color: C.paper, border: `2px solid rgba(245,240,232,0.3)`, boxShadow: `3px 3px 0 rgba(245,240,232,0.15)`, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <AnimatePresence mode="wait">
                  {copied
                    ? <motion.span key="c" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Check size={13} strokeWidth={3} /></motion.span>
                    : <motion.span key="s" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Share2 size={13} strokeWidth={2.5} /></motion.span>
                  }
                </AnimatePresence>
                {copied ? 'Copied!' : 'Share'}
              </motion.button>

              {isCreator && !poll.isPublished && (
                <motion.button onClick={handlePublish} disabled={publishing}
                  whileHover={!publishing ? { y: -2, x: -2, boxShadow: `5px 5px 0 ${C.ink}` } : {}}
                  whileTap={!publishing  ? { y: 1,  x: 1,  boxShadow: `2px 2px 0 ${C.ink}` } : {}}
                  style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.8rem', background: publishing ? 'rgba(232,255,0,0.5)' : C.volt, color: C.ink, border: `2px solid ${C.volt}`, boxShadow: `3px 3px 0 ${C.volt}`, padding: '8px 14px', cursor: publishing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Globe size={13} strokeWidth={2.5} />
                  {publishing ? 'Publishing…' : 'Publish Results'}
                </motion.button>
              )}

              <Link to={`/poll/${id}`} style={{ textDecoration: 'none' }}>
                <motion.button
                  whileHover={{ y: -2, x: -2, boxShadow: `5px 5px 0 ${C.blaze}` }}
                  style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.8rem', background: C.blaze, color: C.paper, border: `2px solid ${C.blaze}`, boxShadow: `3px 3px 0 ${C.blaze}`, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <ArrowUpRight size={13} strokeWidth={2.5} /> View Poll
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 24 }}>
        <StatCard icon={Users}    label="Responses"  value={responses.length}    bg={C.paper} color={C.ink}   delay={0.05} />
        <StatCard icon={Activity} label="Questions"  value={poll.questions.length} bg={C.volt}  color={C.ink}   delay={0.1}  />
        <StatCard icon={Globe}    label="Status"     value={isExpired ? 'Ended' : 'Live'} bg={C.ink} color={C.paper} delay={0.15} />
      </div>

      {/* Live flash */}
      <AnimatePresence>
        {liveFlash && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.volt, border: `2px solid ${C.ink}`, boxShadow: `3px 3px 0 ${C.ink}`, padding: '10px 16px', marginBottom: 14, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.85rem', color: C.ink }}>
            ⚡ New response received!
          </motion.div>
        )}
      </AnimatePresence>

      {/* No responses */}
      {responses.length === 0 ? (
        <Reveal delay={0.2}>
          <div style={{ background: C.paper, border: `2px solid ${C.ink}`, boxShadow: `4px 4px 0 ${C.ink}`, padding: '48px', textAlign: 'center' }}>
            <motion.div animate={{ y: [-4, 4, -4] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} style={{ display: 'inline-block', marginBottom: 16 }}>
              <Activity size={48} color={C.blaze} strokeWidth={1.5} />
            </motion.div>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '1.2rem', color: C.ink, marginBottom: 8 }}>No responses yet</h3>
            <p style={{ fontSize: '0.9rem', color: 'rgba(13,13,13,0.45)' }}>Share the poll link to start collecting votes.</p>
          </div>
        </Reveal>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 14 }}>
          {poll.questions.map((q, qi) => (
            <QuestionBreakdown key={qi} question={q} qIndex={qi} responses={responses} />
          ))}
        </div>
      )}
    </div>
  );
}
