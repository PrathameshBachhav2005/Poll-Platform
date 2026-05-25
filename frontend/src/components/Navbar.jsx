import { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, Plus, LogOut, LogIn, UserPlus, Menu, X } from 'lucide-react';

const C = { ink: '#0d0d0d', paper: '#f5f0e8', blaze: '#ff4d1c', volt: '#e8ff00' };

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [blink, setBlink]     = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const iv = setInterval(() => setBlink(b => !b), 700);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/'); };

  const active = (path) => location.pathname === path;

  const NavLink = ({ to, icon: Icon, children }) => (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <motion.div
        whileHover={{ y: -2 }}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.88rem',
          color: active(to) ? C.blaze : C.ink,
          padding: '6px 12px',
          borderBottom: active(to) ? `2px solid ${C.blaze}` : '2px solid transparent',
        }}
      >
        {Icon && <Icon size={15} strokeWidth={2.5} />}
        {children}
      </motion.div>
    </Link>
  );

  return (
    <motion.nav
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'sticky', top: 0, zIndex: 1000,
        background: C.paper,
        borderBottom: `2px solid ${C.ink}`,
        boxShadow: `0 2px 0 ${C.ink}`,
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <motion.span
            animate={{ opacity: blink ? 1 : 0 }}
            transition={{ duration: 0.1 }}
            style={{ width: 10, height: 10, background: C.volt, border: `2px solid ${C.ink}`, display: 'inline-block', flexShrink: 0 }}
          />
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '1.2rem', color: C.ink, letterSpacing: '-0.02em' }}>
            PollFlow
          </span>
        </Link>

        {/* Desktop */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {user ? (
            <>
              <NavLink to="/dashboard" icon={LayoutDashboard}>Dashboard</NavLink>
              <NavLink to="/create"    icon={Plus}>New Poll</NavLink>
              <motion.button
                onClick={handleLogout}
                whileHover={{ y: -2, x: -2, boxShadow: `5px 5px 0 ${C.ink}` }}
                whileTap={{ y: 1, x: 1, boxShadow: `2px 2px 0 ${C.ink}` }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.88rem',
                  background: 'transparent', color: C.ink,
                  border: `2px solid ${C.ink}`, boxShadow: `3px 3px 0 ${C.ink}`,
                  padding: '6px 14px', cursor: 'pointer', marginLeft: 8,
                }}
              >
                <LogOut size={14} strokeWidth={2.5} /> Logout
              </motion.button>
            </>
          ) : (
            <>
              <NavLink to="/login" icon={LogIn}>Login</NavLink>
              <Link to="/register" style={{ textDecoration: 'none', marginLeft: 8 }}>
                <motion.button
                  whileHover={{ y: -2, x: -2, boxShadow: `6px 6px 0 ${C.ink}` }}
                  whileTap={{ y: 1, x: 1, boxShadow: `2px 2px 0 ${C.ink}` }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.88rem',
                    background: C.ink, color: C.paper,
                    border: `2px solid ${C.ink}`, boxShadow: `4px 4px 0 ${C.ink}`,
                    padding: '7px 16px', cursor: 'pointer',
                  }}
                >
                  <UserPlus size={14} strokeWidth={2.5} /> Sign up free
                </motion.button>
              </Link>
            </>
          )}

          {/* Mobile hamburger */}
          <motion.button
            onClick={() => setMenuOpen(o => !o)}
            whileTap={{ scale: 0.9 }}
            style={{
              background: 'none', border: `2px solid ${C.ink}`,
              padding: '5px 7px', cursor: 'pointer', marginLeft: 12, color: C.ink,
              display: 'none',
            }}
            className="mobile-menu-btn"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </motion.button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: 'hidden', borderTop: `2px solid ${C.ink}`, background: C.paper }}
          >
            <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {user ? (
                <>
                  <Link to="/dashboard" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: C.ink, textDecoration: 'none' }}>Dashboard</Link>
                  <Link to="/create"    style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: C.ink, textDecoration: 'none' }}>New Poll</Link>
                  <button onClick={handleLogout} style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, background: 'none', border: 'none', color: C.blaze, cursor: 'pointer', textAlign: 'left', padding: 0 }}>Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login"    style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: C.ink, textDecoration: 'none' }}>Login</Link>
                  <Link to="/register" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: C.blaze, textDecoration: 'none' }}>Sign up free</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
