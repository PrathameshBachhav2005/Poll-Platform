import { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, AlertCircle, ArrowRight, ChevronDown, CheckCircle } from 'lucide-react';

const C = { ink: '#0d0d0d', paper: '#f5f0e8', blaze: '#ff4d1c', volt: '#e8ff00' };

function FieldLabel({ children, hint }) {
  return (
    <label style={{ display: 'block', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: C.ink, opacity: 0.5, marginBottom: 8 }}>
      {children}
      {hint && <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0, marginLeft: 6, opacity: 0.8 }}>{hint}</span>}
    </label>
  );
}

function BrutalTextInput({ value, onChange, placeholder, required, type = 'text' }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder} required={required}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{ width: '100%', background: C.paper, border: `2px solid ${C.ink}`, boxShadow: focused ? `4px 4px 0 ${C.blaze}` : `4px 4px 0 ${C.ink}`, outline: 'none', padding: '11px 14px', fontFamily: "'Inter', sans-serif", fontSize: '0.95rem', color: C.ink, transition: 'box-shadow 0.15s', borderRadius: 0, margin: 0 }}
    />
  );
}

function BrutalSelect({ value, onChange, children }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value} onChange={onChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: '100%', background: C.paper, border: `2px solid ${C.ink}`, boxShadow: focused ? `4px 4px 0 ${C.blaze}` : `4px 4px 0 ${C.ink}`, outline: 'none', padding: '11px 40px 11px 14px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '0.9rem', color: C.ink, appearance: 'none', cursor: 'pointer', transition: 'box-shadow 0.15s', borderRadius: 0, margin: 0 }}
      >
        {children}
      </select>
      <ChevronDown size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: C.ink }} />
    </div>
  );
}

export default function EditPoll() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [title,       setTitle]       = useState('');
  const [expiresAt,   setExpiresAt]   = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [questions,   setQuestions]   = useState([{ text: '', options: ['', ''], isMandatory: true }]);
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [success,     setSuccess]     = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/polls/${id}`)
      .then(res => {
        const poll = res.data;
        // Check ownership
        if (user && poll.creator.toString() !== user.id) {
          setError('You are not authorized to edit this poll.');
          setLoading(false);
          return;
        }
        setTitle(poll.title);
        setIsAnonymous(poll.isAnonymous);
        setQuestions(poll.questions.map(q => ({
          text: q.text,
          options: [...q.options],
          isMandatory: q.isMandatory,
        })));
        // Format the date for datetime-local input
        const d = new Date(poll.expiresAt);
        setExpiresAt(new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
        setLoading(false);
      })
      .catch(() => {
        setError('Poll not found or failed to load.');
        setLoading(false);
      });
  }, [id, user]);

  const addQ    = () => setQuestions(q => [...q, { text: '', options: ['', ''], isMandatory: true }]);
  const removeQ = (i) => setQuestions(q => q.filter((_, idx) => idx !== i));
  const updateQ = (i, f, v) => setQuestions(q => { const n = [...q]; n[i] = { ...n[i], [f]: v }; return n; });
  const addOpt  = (qi) => setQuestions(q => { const n = [...q]; n[qi] = { ...n[qi], options: [...n[qi].options, ''] }; return n; });
  const removeOpt = (qi, oi) => setQuestions(q => { const n = [...q]; n[qi] = { ...n[qi], options: n[qi].options.filter((_, i) => i !== oi) }; return n; });
  const updateOpt = (qi, oi, v) => setQuestions(q => { const n = [...q]; const opts = [...n[qi].options]; opts[oi] = v; n[qi] = { ...n[qi], options: opts }; return n; });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      await api.put(`/polls/${id}`, { title, expiresAt, isAnonymous, questions });
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update poll');
    } finally { setSubmitting(false); }
  };

  /* Loading */
  if (loading) return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: `3px solid ${C.ink}`, borderTopColor: C.blaze, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  /* Success */
  if (success) return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        style={{ background: C.paper, border: `2px solid ${C.ink}`, boxShadow: `6px 6px 0 ${C.ink}`, padding: '48px 40px', textAlign: 'center', maxWidth: 440 }}
      >
        <motion.div animate={{ y: [-4, 4, -4] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} style={{ display: 'inline-block', marginBottom: 16 }}>
          <CheckCircle size={52} color={C.blaze} strokeWidth={1.5} />
        </motion.div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '1.5rem', color: C.ink, marginBottom: 10 }}>Poll Updated!</h2>
        <p style={{ fontSize: '0.92rem', color: 'rgba(13,13,13,0.5)' }}>Redirecting to dashboard…</p>
      </motion.div>
    </div>
  );

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} style={{ marginBottom: 36 }}>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: C.ink, opacity: 0.4 }}>Edit</span>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', color: C.ink, lineHeight: 1.1, marginTop: 6 }}>Update Poll</h1>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.blaze, border: `2px solid ${C.ink}`, boxShadow: `4px 4px 0 ${C.ink}`, padding: '12px 16px', marginBottom: 20, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.88rem', color: C.paper }}>
            <AlertCircle size={16} strokeWidth={2.5} /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit}>
        {/* General settings */}
        <div style={{ background: C.paper, border: `2px solid ${C.ink}`, boxShadow: `5px 5px 0 ${C.ink}`, padding: '28px', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
            <div style={{ width: 28, height: 28, background: C.volt, border: `2px solid ${C.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.72rem', color: C.ink }}>01</span>
            </div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '1rem', color: C.ink }}>General Settings</h2>
          </div>

          <div style={{ marginBottom: 20 }}>
            <FieldLabel>Poll Title</FieldLabel>
            <BrutalTextInput value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Product Feedback Q3 2026" required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
            <div>
              <FieldLabel>Expiry Date & Time</FieldLabel>
              <BrutalTextInput type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} required />
            </div>
            <div>
              <FieldLabel>Response Mode</FieldLabel>
              <BrutalSelect value={isAnonymous} onChange={e => setIsAnonymous(e.target.value === 'true')}>
                <option value="true">Anonymous — open to everyone</option>
                <option value="false">Authenticated — requires login</option>
              </BrutalSelect>
            </div>
          </div>
        </div>

        {/* Questions */}
        <AnimatePresence>
          {questions.map((q, qi) => (
            <motion.div
              key={qi}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              style={{ background: C.paper, border: `2px solid ${C.ink}`, boxShadow: `5px 5px 0 ${C.ink}`, padding: '28px', marginBottom: 18 }}
            >
              {/* Question header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, background: C.blaze, border: `2px solid ${C.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.72rem', color: C.paper }}>{String(qi + 2).padStart(2, '0')}</span>
                  </div>
                  <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '1rem', color: C.ink }}>Question {qi + 1}</h2>
                </div>
                {questions.length > 1 && (
                  <motion.button type="button" onClick={() => removeQ(qi)}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    style={{ background: 'transparent', border: `2px solid ${C.ink}`, boxShadow: `2px 2px 0 ${C.ink}`, padding: '5px 10px', cursor: 'pointer', color: C.blaze, display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.75rem' }}>
                    <Trash2 size={12} strokeWidth={2.5} /> Remove
                  </motion.button>
                )}
              </div>

              <div style={{ marginBottom: 18 }}>
                <FieldLabel>Question Text</FieldLabel>
                <BrutalTextInput value={q.text} onChange={e => updateQ(qi, 'text', e.target.value)} placeholder="What is your favorite feature?" required />
              </div>

              {/* Mandatory toggle */}
              <div onClick={() => updateQ(qi, 'isMandatory', !q.isMandatory)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 20, userSelect: 'none' }}>
                <motion.div animate={{ background: q.isMandatory ? C.ink : 'transparent' }}
                  style={{ width: 20, height: 20, border: `2px solid ${C.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {q.isMandatory && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1.5 5L4 7.5L8.5 2.5" stroke={C.paper} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
                    </motion.div>
                  )}
                </motion.div>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.85rem', color: C.ink }}>This question is mandatory</span>
              </div>

              {/* Options */}
              <div style={{ borderLeft: `3px solid ${C.ink}`, paddingLeft: 20 }}>
                <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: C.ink, opacity: 0.4, marginBottom: 12 }}>Options</p>
                <AnimatePresence>
                  {q.options.map((opt, oi) => (
                    <motion.div key={oi} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 22, height: 22, border: `2px solid ${C.ink}`, background: C.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.62rem', color: C.ink }}>{oi + 1}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <BrutalTextInput value={opt} onChange={e => updateOpt(qi, oi, e.target.value)} placeholder={`Option ${oi + 1}`} required />
                      </div>
                      {q.options.length > 2 && (
                        <motion.button type="button" onClick={() => removeOpt(qi, oi)}
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.blaze, padding: 4, flexShrink: 0 }}>
                          <Trash2 size={14} strokeWidth={2.5} />
                        </motion.button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                <motion.button type="button" onClick={() => addOpt(qi)}
                  whileHover={{ y: -2, x: -2, boxShadow: `4px 4px 0 ${C.ink}` }}
                  whileTap={{ y: 1, x: 1, boxShadow: `1px 1px 0 ${C.ink}` }}
                  style={{ marginTop: 4, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.8rem', background: C.volt, color: C.ink, border: `2px solid ${C.ink}`, boxShadow: `3px 3px 0 ${C.ink}`, padding: '6px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Plus size={13} strokeWidth={2.5} /> Add option
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Footer actions */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, paddingTop: 4 }}>
          <motion.button type="button" onClick={addQ}
            whileHover={{ y: -2, x: -2, boxShadow: `5px 5px 0 ${C.ink}` }}
            whileTap={{ y: 1, x: 1, boxShadow: `2px 2px 0 ${C.ink}` }}
            style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.88rem', background: C.paper, color: C.ink, border: `2px solid ${C.ink}`, boxShadow: `3px 3px 0 ${C.ink}`, padding: '11px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
            <Plus size={15} strokeWidth={2.5} /> Add Question
          </motion.button>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <motion.button type="button" onClick={() => navigate('/dashboard')}
              whileHover={{ y: -2, x: -2, boxShadow: `5px 5px 0 ${C.ink}` }}
              whileTap={{ y: 1, x: 1, boxShadow: `2px 2px 0 ${C.ink}` }}
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.88rem', background: C.paper, color: C.ink, border: `2px solid ${C.ink}`, boxShadow: `3px 3px 0 ${C.ink}`, padding: '12px 22px', cursor: 'pointer' }}>
              Cancel
            </motion.button>

            <motion.button type="submit" disabled={submitting}
              whileHover={!submitting ? { y: -3, x: -3, boxShadow: `7px 7px 0 ${C.ink}` } : {}}
              whileTap={!submitting  ? { y: 2,  x: 2,  boxShadow: `2px 2px 0 ${C.ink}` } : {}}
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.95rem', background: submitting ? 'rgba(255,77,28,0.4)' : C.blaze, color: C.paper, border: `2px solid ${C.ink}`, boxShadow: `4px 4px 0 ${C.ink}`, padding: '12px 26px', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              {submitting ? 'Updating…' : <><span>Update Poll</span><ArrowRight size={17} /></>}
            </motion.button>
          </div>
        </motion.div>
      </form>
    </div>
  );
}
