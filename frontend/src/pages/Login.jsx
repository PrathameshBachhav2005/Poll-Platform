import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';

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

export default function Login() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const { login } = useContext(AuthContext);
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(!err.response ? 'Cannot connect to server. Is the backend running?' : err.response?.data?.msg || 'Login failed. Check your credentials.');
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
        {/* Header card */}
        <div style={{ background: C.ink, border: `2px solid ${C.ink}`, boxShadow: `6px 6px 0 ${C.blaze}`, padding: '28px 32px', marginBottom: -2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 10, height: 10, background: C.volt, border: `2px solid ${C.paper}` }} />
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: C.paper, opacity: 0.5 }}>PollFlow</span>
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '2rem', color: C.paper, lineHeight: 1.1 }}>
            Welcome back.
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'rgba(245,240,232,0.55)', marginTop: 6 }}>Sign in to manage your polls.</p>
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

          <form onSubmit={handleSubmit}>
            <BrutalInput icon={Mail} label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            <BrutalInput
              icon={Lock} label="Password" type={showPw ? 'text' : 'password'}
              value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
              rightEl={
                <button type="button" onClick={() => setShowPw(s => !s)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(13,13,13,0.45)', padding: 0, display: 'flex', alignItems: 'center' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            <div style={{ textAlign: 'right', marginTop: -12, marginBottom: 20 }}>
              <Link to="/forgot-password" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '0.82rem', color: C.ink, textDecoration: 'none', borderBottom: `1px solid rgba(13,13,13,0.3)` }}>
                Forgot password?
              </Link>
            </div>

            <motion.button
              type="submit" disabled={loading}
              whileHover={!loading ? { y: -3, x: -3, boxShadow: `7px 7px 0 ${C.ink}` } : {}}
              whileTap={!loading  ? { y: 2,  x: 2,  boxShadow: `2px 2px 0 ${C.ink}` } : {}}
              style={{ width: '100%', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '1rem', background: loading ? 'rgba(255,77,28,0.4)' : C.blaze, color: C.paper, border: `2px solid ${C.ink}`, boxShadow: `4px 4px 0 ${C.ink}`, padding: '14px 20px', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {loading ? 'Signing in…' : <><span>Sign in</span><ArrowRight size={18} /></>}
            </motion.button>
          </form>

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: `2px solid ${C.ink}`, textAlign: 'center' }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '0.88rem', color: 'rgba(13,13,13,0.55)' }}>
              No account yet?{' '}
            </span>
            <Link to="/register" style={{ textDecoration: 'none' }}>
              <motion.span whileHover={{ color: C.blaze }}
                style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.88rem', color: C.ink, borderBottom: `2px solid ${C.ink}`, paddingBottom: 1 }}>
                Create one free →
              </motion.span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
