import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../utils/api';

const C = { ink: '#0d0d0d', paper: '#f5f0e8', blaze: '#ff4d1c', volt: '#e8ff00' };

function BrutalInput({ icon: Icon, label, type, value, onChange, placeholder, required, rightEl }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: C.ink, opacity: 0.55, marginBottom: 8 }}>
        {label}
      </label>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        border: `2px solid ${C.ink}`,
        boxShadow: focused ? `4px 4px 0 ${C.blaze}` : `4px 4px 0 ${C.ink}`,
        background: C.paper, padding: '11px 14px',
        transition: 'box-shadow 0.15s',
      }}>
        <Icon size={16} color={focused ? C.blaze : 'rgba(13,13,13,0.45)'} strokeWidth={2.5} style={{ flexShrink: 0 }} />
        <input
          type={type} value={value} onChange={onChange} placeholder={placeholder} required={required}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: "'Inter', sans-serif", fontSize: '0.95rem', color: C.ink, padding: 0, margin: 0, width: '100%' }}
        />
        {rightEl}
      </div>
    </div>
  );
}

export default function ForgotPassword() {
  const [email,       setEmail]       = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPw,      setShowPw]      = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState(false);
  const [loading,     setLoading]     = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/auth/reset-password', { email, newPassword });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2800);
    } catch (err) {
      setError(!err.response ? 'Cannot connect to server. Is the backend running?' : err.response?.data?.msg || 'Failed to reset password.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', background: C.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px',
      backgroundImage: `linear-gradient(${C.ink}10 1px, transparent 1px), linear-gradient(90deg, ${C.ink}10 1px, transparent 1px)`,
      backgroundSize: '40px 40px',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: '100%', maxWidth: 440 }}
      >
        {/* Header */}
        <div style={{ background: C.ink, border: `2px solid ${C.ink}`, boxShadow: `6px 6px 0 ${C.volt}`, padding: '28px 32px', marginBottom: -2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 10, height: 10, background: C.volt, border: `2px solid ${C.paper}` }} />
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: C.paper, opacity: 0.5 }}>PollFlow</span>
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '2rem', color: C.paper, lineHeight: 1.1 }}>
            Reset password.
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'rgba(245,240,232,0.55)', marginTop: 6 }}>Enter your email and a new password.</p>
        </div>

        {/* Form card */}
        <div style={{ background: C.paper, border: `2px solid ${C.ink}`, boxShadow: `6px 6px 0 ${C.ink}`, padding: '32px' }}>
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: C.blaze, border: `2px solid ${C.ink}`, boxShadow: `3px 3px 0 ${C.ink}`, padding: '10px 14px', marginBottom: 24, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.85rem', color: C.paper }}
              >
                <AlertCircle size={16} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 1 }} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.volt, border: `2px solid ${C.ink}`, boxShadow: `3px 3px 0 ${C.ink}`, padding: '14px 16px', marginBottom: 24, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.88rem', color: C.ink }}
              >
                <CheckCircle size={18} strokeWidth={2.5} />
                Password reset! Redirecting to login…
              </motion.div>
            )}
          </AnimatePresence>

          {!success && (
            <form onSubmit={handleSubmit}>
              <BrutalInput icon={Mail} label="Account Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
              <BrutalInput
                icon={Lock} label="New Password" type={showPw ? 'text' : 'password'}
                value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 6 characters" required
                rightEl={
                  <button type="button" onClick={() => setShowPw(s => !s)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(13,13,13,0.45)', padding: 0, display: 'flex', alignItems: 'center' }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
              <motion.button
                type="submit" disabled={loading}
                whileHover={!loading ? { y: -3, x: -3, boxShadow: `7px 7px 0 ${C.ink}` } : {}}
                whileTap={!loading  ? { y: 2,  x: 2,  boxShadow: `2px 2px 0 ${C.ink}` } : {}}
                style={{ width: '100%', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '1rem', background: loading ? 'rgba(13,13,13,0.35)' : C.ink, color: C.paper, border: `2px solid ${C.ink}`, boxShadow: `4px 4px 0 ${C.ink}`, padding: '14px 20px', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {loading ? 'Resetting…' : <><span>Reset password</span><ArrowRight size={18} /></>}
              </motion.button>
            </form>
          )}

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: `2px solid ${C.ink}`, textAlign: 'center' }}>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <motion.span whileHover={{ color: C.blaze }}
                style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.88rem', color: C.ink, borderBottom: `2px solid ${C.ink}`, paddingBottom: 1 }}>
                ← Back to login
              </motion.span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
