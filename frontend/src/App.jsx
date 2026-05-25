import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import CreatePoll from './pages/CreatePoll';
import PollView from './pages/PollView';
import PollResults from './pages/PollResults';

/* Hide the app-level Navbar on the landing page (it has its own) */
function Layout({ children }) {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  return (
    <>
      {!isLanding && <Navbar />}
      {isLanding
        ? children
        : <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 80px' }}>{children}</div>
      }
    </>
  );
}

function App() {
  const { user, loading } = React.useContext(AuthContext);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f0e8' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #0d0d0d', borderTopColor: '#ff4d1c', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/"                  element={<LandingPage />} />
          <Route path="/login"             element={!user ? <Login />         : <Navigate to="/dashboard" />} />
          <Route path="/register"          element={!user ? <Register />      : <Navigate to="/dashboard" />} />
          <Route path="/forgot-password"   element={<ForgotPassword />} />
          <Route path="/dashboard"         element={user  ? <Dashboard />     : <Navigate to="/login" />} />
          <Route path="/create"            element={user  ? <CreatePoll />    : <Navigate to="/login" />} />
          <Route path="/poll/:id"          element={<PollView />} />
          <Route path="/poll/:id/results"  element={<PollResults />} />
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </Router>
  );
}

function NotFound() {
  const C = { ink: '#0d0d0d', paper: '#f5f0e8', blaze: '#ff4d1c', volt: '#e8ff00' };
  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.paper }}>
      <div style={{ textAlign: 'center', border: `2px solid ${C.ink}`, boxShadow: `6px 6px 0 ${C.ink}`, padding: '60px 48px', background: C.paper }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '6rem', color: C.blaze, lineHeight: 1 }}>404</div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '1.5rem', color: C.ink, margin: '16px 0 8px' }}>Page not found</h2>
        <p style={{ color: 'rgba(13,13,13,0.55)', marginBottom: 28 }}>The page you're looking for doesn't exist.</p>
        <a href="/" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.95rem', background: C.ink, color: C.paper, border: `2px solid ${C.ink}`, boxShadow: `4px 4px 0 ${C.ink}`, padding: '12px 24px', textDecoration: 'none', display: 'inline-block' }}>
          Go home →
        </a>
      </div>
    </div>
  );
}

export default App;
