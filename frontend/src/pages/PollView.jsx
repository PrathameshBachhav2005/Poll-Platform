import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, AlertCircle, CheckCircle, ArrowRight, Lock, BarChart3 } from 'lucide-react';

const C = { ink: '#0d0d0d', paper: '#f5f0e8', blaze: '#ff4d1c', volt: '#e8ff00' };

/* ── Reusable status screen ─────────────────────────────── */
function StatusScreen({ icon: Icon, iconColor, title, subtitle, children }) {
  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ background: C.paper, border: `2px solid ${C.ink}`, boxShadow: `6px 6px 0 ${C.ink}`, padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center' }}
      >
        <motion.div animate={{ y: [-4, 4, -4] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} style={{ display: 'inline-block', marginBottom: 20 }}>
          <Icon size={56} color={iconColor} strokeWidth={1.5} />
        </motion.div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '1.7rem', color: C.ink, marginBottom: 10 }}>{title}</h2>
        <p style={{ fontSize: '0.95rem', color: 'rgba(13,13,13,0.55)', lineHeight: 1.7, marginBottom: 28 }}>{subtitle}</p>
        {children}
      </motion.div>
    </div>
  );
}

function BrutalBtn({ onClick, href, to, bg = C.ink, color = C.paper, children }) {
  const style = { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.9rem', background: bg, color, border: `2px solid ${C.ink}`, boxShadow: `3px 3px 0 ${C.ink}`, padding: '10px 22px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' };
  if (to) return <Link to={to} style={style}>{children}</Link>;
  return <motion.button onClick={onClick} whileHover={{ y: -2, x: -2, boxShadow: `5px 5px 0 ${C.ink}` }} whileTap={{ y: 1, x: 1, boxShadow: `2px 2px 0 ${C.ink}` }} style={style}>{children}</motion.button>;
}

export default function PollView() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [poll,       setPoll]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [answers,    setAnswers]    = useState([]);
  const [submitted,  setSubmitted]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitErr,  setSubmitErr]  = useState('');

  useEffect(() => {
    api.get(`/polls/${id}`)
      .then(res => setPoll(res.data))
      .catch(() => setError('Poll not found or failed to load.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSelect = (qi, opt) => {
    setAnswers(prev => {
      const next = prev.filter(a => a.questionIndex !== qi);
      return [...next, { questionIndex: qi, selectedOption: opt }];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setSubmitErr('');
    try {
      await api.post(`/responses/${id}`, { answers });
      setSubmitted(true);
    } catch (err) {
      setSubmitErr(err.response?.data?.msg || 'Failed to submit. Please try again.');
    } finally { setSubmitting(false); }
  };

  /* ── Loading ── */
  if (loading) return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: `3px solid ${C.ink}`, borderTopColor: C.blaze, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  if (error) return (
    <StatusScreen icon={AlertCircle} iconColor={C.blaze} title="Poll not found" subtitle={error}>
      <BrutalBtn to="/">Go home</BrutalBtn>
    </StatusScreen>
  );

  const isExpired = new Date() > new Date(poll.expiresAt);

  /* ── Submitted ── */
  if (submitted) return (
    <StatusScreen icon={CheckCircle} iconColor={C.blaze} title="Vote recorded!" subtitle="Your response has been submitted. Thanks for participating.">
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        {poll.isPublished && <BrutalBtn to={`/poll/${id}/results`} bg={C.blaze}><BarChart3 size={15} /> View Results</BrutalBtn>}
        <BrutalBtn to="/" bg={C.paper} color={C.ink}>Back to home</BrutalBtn>
      </div>
    </StatusScreen>
  );

  /* ── Poll ended + published ── */
  if (poll.isPublished && isExpired) return (
    <StatusScreen icon={BarChart3} iconColor={C.ink} title="Poll has ended" subtitle="The creator has published the final results.">
      <BrutalBtn to={`/poll/${id}/results`} bg={C.blaze}><BarChart3 size={15} /> View Results</BrutalBtn>
    </StatusScreen>
  );

  /* ── Expired ── */
  if (isExpired) return (
    <StatusScreen icon={Clock} iconColor={C.ink} title="Poll expired" subtitle="This poll is no longer accepting responses." />
  );

  /* ── Auth required ── */
  if (!poll.isAnonymous && !user) return (
    <StatusScreen icon={Lock} iconColor={C.ink} title="Login required" subtitle="This poll requires authentication. Sign in or create a free account to participate.">
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <BrutalBtn to="/login"    bg={C.blaze}>Login</BrutalBtn>
        <BrutalBtn to="/register" bg={C.paper} color={C.ink}>Sign up free</BrutalBtn>
      </div>
    </StatusScreen>
  );

  /* ── Poll form ── */
  const answeredCount = answers.length;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {/* Poll header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ background: C.ink, border: `2px solid ${C.ink}`, boxShadow: `5px 5px 0 ${C.blaze}`, padding: '26px 30px', marginBottom: 20 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: C.paper, opacity: 0.4 }}>Live Poll</span>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 'clamp(1.2rem, 3vw, 1.7rem)', color: C.paper, lineHeight: 1.2, marginTop: 6 }}>{poll.title}</h1>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.68rem', background: C.volt, color: C.ink, border: `2px solid ${C.paper}`, padding: '3px 10px' }}>● Active</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={12} color="rgba(245,240,232,0.45)" strokeWidth={2} />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '0.75rem', color: 'rgba(245,240,232,0.45)' }}>
                Closes {new Date(poll.expiresAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Progress bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, height: 6, background: 'rgba(13,13,13,0.1)', border: `1.5px solid ${C.ink}`, overflow: 'hidden' }}>
          <motion.div
            animate={{ width: `${poll.questions.length > 0 ? (answeredCount / poll.questions.length) * 100 : 0}%` }}
            transition={{ duration: 0.4 }}
            style={{ height: '100%', background: C.blaze }}
          />
        </div>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.75rem', color: 'rgba(13,13,13,0.45)', whiteSpace: 'nowrap' }}>
          {answeredCount} / {poll.questions.length}
        </span>
      </motion.div>

      {/* Submit error */}
      <AnimatePresence>
        {submitErr && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.blaze, border: `2px solid ${C.ink}`, boxShadow: `3px 3px 0 ${C.ink}`, padding: '10px 14px', marginBottom: 16, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.85rem', color: C.paper }}>
            <AlertCircle size={15} strokeWidth={2.5} /> {submitErr}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Questions */}
      <form onSubmit={handleSubmit}>
        {poll.questions.map((q, qi) => {
          const currentAnswer = answers.find(a => a.questionIndex === qi)?.selectedOption;
          return (
            <motion.div
              key={qi}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: qi * 0.07 + 0.15, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{ background: C.paper, border: `2px solid ${C.ink}`, boxShadow: `4px 4px 0 ${C.ink}`, padding: '22px', marginBottom: 14 }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 18 }}>
                <div style={{ width: 26, height: 26, background: currentAnswer ? C.blaze : C.paper, border: `2px solid ${C.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.68rem', color: currentAnswer ? C.paper : C.ink }}>{String(qi + 1).padStart(2, '0')}</span>
                </div>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.98rem', color: C.ink, lineHeight: 1.4, paddingTop: 3 }}>
                  {q.text}{q.isMandatory && <span style={{ color: C.blaze, marginLeft: 4 }}>*</span>}
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {q.options.map((opt, oi) => {
                  const selected = currentAnswer === opt;
                  return (
                    <motion.label key={oi} whileHover={{ x: 3 }} whileTap={{ scale: 0.99 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', cursor: 'pointer', border: `2px solid ${selected ? C.blaze : C.ink}`, boxShadow: selected ? `3px 3px 0 ${C.blaze}` : `3px 3px 0 ${C.ink}`, background: selected ? 'rgba(255,77,28,0.07)' : C.paper, transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s' }}>
                      <input type="radio" name={`q-${qi}`} value={opt} checked={selected} onChange={() => handleSelect(qi, opt)} required={q.isMandatory} style={{ display: 'none' }} />
                      {/* Custom radio */}
                      <div style={{ width: 18, height: 18, border: `2px solid ${selected ? C.blaze : C.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: selected ? C.blaze : 'transparent', transition: 'all 0.15s' }}>
                        {selected && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ width: 6, height: 6, background: C.paper }} />}
                      </div>
                      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: selected ? 700 : 600, fontSize: '0.9rem', color: selected ? C.blaze : C.ink, flex: 1 }}>{opt}</span>
                      {selected && (
                        <motion.span initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                          style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.65rem', background: C.blaze, color: C.paper, padding: '2px 8px', border: `1.5px solid ${C.ink}` }}>
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

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <motion.button type="submit" disabled={submitting}
            whileHover={!submitting ? { y: -3, x: -3, boxShadow: `7px 7px 0 ${C.ink}` } : {}}
            whileTap={!submitting  ? { y: 2,  x: 2,  boxShadow: `2px 2px 0 ${C.ink}` } : {}}
            style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.95rem', background: submitting ? 'rgba(255,77,28,0.4)' : C.blaze, color: C.paper, border: `2px solid ${C.ink}`, boxShadow: `4px 4px 0 ${C.ink}`, padding: '13px 30px', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            {submitting ? 'Submitting…' : <><span>Submit Responses</span><ArrowRight size={17} /></>}
          </motion.button>
        </motion.div>
      </form>
    </div>
  );
}
