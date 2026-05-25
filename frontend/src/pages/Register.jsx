import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Check } from 'lucide-react';

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

const PERKS = ['Unlimited free polls', 'Real-time results', 'No credit card needed'];

export default function Register() {
  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await register(username, email, password);
      // Account created — show success banner then go to login
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(!err.response ? 'Cannot connect to server. Is the backend running?' : err.response?.data?.msg || 'Registration failed. Try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', background: C.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px',
      backgroundImage: `linear-gradient(${C.ink}10 1px, transparent 1px), linear-gradient(90deg, ${C.ink}10 1px, transparent 1px)`,
      backgroundSize: '40px 40px',
    }}>
      <div style={{ width: '100%', maxWidth: 860, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 0, alignItems: 'stretch' }}>

        {/* Left — volt panel */}
        <motion.div
          initial={{ opacity: 0, x: -32 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: C.volt, border: `2px solid ${C.ink}`, boxShadow: `6px 6px 0 ${C.ink}`, padding: '40px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
              <div style={{ width: 10, height: 10, background: C.ink, border: `2px solid ${C.ink}` }} />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: C.ink, opacity: 0.5 }}>PollFlow</span>
            </div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', color: C.ink, lineHeight: 1.1, marginBottom: 16 }}>
              Start polling<br />for free.
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'rgba(13,13,13,0.65)', lineHeight: 1.7, marginBottom: 32 }}>
              Join thousands of creators who use PollFlow to gather real-time feedback.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {PERKS.map((p, i) => (
                <motion.div key={p} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 22, height: 22, background: C.ink, border: `2px solid ${C.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={12} color={C.volt} strokeWidth={3} />
                  </div>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.9rem', color: C.ink }}>{p}</span>
                </motion.div>
              ))}
            </div>
          </div>
          <motion.div
            animate={{ rotate: [-3, 3, -3] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{ marginTop: 40, alignSelf: 'flex-start', background: C.blaze, color: C.paper, border: `2px solid ${C.ink}`, boxShadow: `4px 4px 0 ${C.ink}`, padding: '8px 16px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.85rem' }}
          >
            ⚡ Free forever plan
          </motion.div>
        </motion.div>

        {/* Right — form */}
        <motion.div
          initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: C.paper, border: `2px solid ${C.ink}`, boxShadow: `6px 6px 0 ${C.ink}`, padding: '40px 36px', borderLeft: 'none' }}
        >
          <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '1.4rem', color: C.ink, marginBottom: 28 }}>
            Create your account
          </h3>

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
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.volt, border: `2px solid ${C.ink}`, boxShadow: `3px 3px 0 ${C.ink}`, padding: '12px 14px', marginBottom: 24, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.88rem', color: C.ink }}
              >
                <Check size={16} strokeWidth={3} style={{ flexShrink: 0 }} />
                Account created! Redirecting to login…
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit}>
            <BrutalInput icon={User}  label="Username" type="text"     value={username} onChange={e => setUsername(e.target.value)} placeholder="pollmaster99"    required />
            <BrutalInput icon={Mail}  label="Email"    type="email"    value={email}    onChange={e => setEmail(e.target.value)}    placeholder="you@example.com"  required />
            <BrutalInput
              icon={Lock} label="Password" type={showPw ? 'text' : 'password'}
              value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" required
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
              style={{ width: '100%', marginTop: 8, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '1rem', background: loading ? 'rgba(13,13,13,0.35)' : C.ink, color: C.paper, border: `2px solid ${C.ink}`, boxShadow: `4px 4px 0 ${C.ink}`, padding: '14px 20px', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {loading ? 'Creating account…' : <><span>Create account</span><ArrowRight size={18} /></>}
            </motion.button>
          </form>

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: `2px solid ${C.ink}`, textAlign: 'center' }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '0.88rem', color: 'rgba(13,13,13,0.55)' }}>
              Already have an account?{' '}
            </span>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <motion.span whileHover={{ color: C.blaze }}
                style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.88rem', color: C.ink, borderBottom: `2px solid ${C.ink}`, paddingBottom: 1 }}>
                Sign in →
              </motion.span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
