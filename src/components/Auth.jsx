import React, { useState } from 'react';
import { Mail, CheckCircle2, Lock } from 'lucide-react';

// Flip to true once the Google provider is configured in Supabase
// (Dashboard → Authentication → Providers → Google) and OAuth
// credentials exist in Google Cloud Console.
const GOOGLE_AUTH_ENABLED = false;

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 32.1 29.4 35 24 35c-6.1 0-11.3-4.1-13.1-9.6-1.4-4.1-1.4-8.6 0-12.7C12.7 7.1 17.9 3 24 3c3.7 0 7.1 1.3 9.7 3.6l6-6C36.1 1.4 30.3 -1 24 0 14.1 0 5.7 5.9 2 14.3c-1.4 3.1-2 6.6-2 10s.6 6.9 2 10C5.7 42.1 14.1 48 24 48c9.6 0 18.6-6.9 18.6-19.5 0-1.3-.1-2.7-.4-4z"/>
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.7 18.9 13 24 13c3.7 0 7.1 1.3 9.7 3.6l6-6C36.1 6.1 30.3 3 24 3c-8 0-14.9 4.5-18.4 11.1l.7.6z"/>
    <path fill="#4CAF50" d="M24 48c6.2 0 11.9-2.1 16.3-5.8l-6.6-5.6C31.4 38.1 27.9 39 24 39c-5.3 0-9.9-2.9-11.9-7.5l-6.6 5.1C9.5 43.5 16.2 48 24 48z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.9 2.6-2.6 4.8-4.8 6.4l6.6 5.6C40.6 37.3 44 31.5 44 24c0-1.3-.1-2.7-.4-3.5z"/>
  </svg>
);

export function SignIn({ onSignInWithPassword, onSignUpWithPassword, onSignInWithGoogle, onSignInWithMagicLink, onResetPassword }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'magic' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setError('');
    const { error } = await onSignInWithGoogle();
    if (error) setError(error.message);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');

    if (mode === 'magic') {
      setLoading(true);
      const { error } = await onSignInWithMagicLink(email.trim());
      setLoading(false);
      if (error) setError(error.message);
      else setSent(true);
      return;
    }

    if (mode === 'reset') {
      setLoading(true);
      const { error } = await onResetPassword(email.trim());
      setLoading(false);
      if (error) setError(error.message);
      else setSent(true);
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
      if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
      setLoading(true);
      const { error } = await onSignUpWithPassword(email.trim(), password);
      setLoading(false);
      if (error) setError(error.message);
      else setSent(true);
      return;
    }

    setLoading(true);
    const { error } = await onSignInWithPassword(email.trim(), password);
    setLoading(false);
    if (error) setError(error.message);
  };

  return (
    <div className="auth-screen">
      <img src="/logo-header.png" alt="Perfect Flow" className="auth-logo" />
      <h1>Perfect Flow</h1>
      <p className="auth-tagline">Your Song. Your Flow.</p>

      {sent ? (
        <div className="auth-sent">
          <CheckCircle2 size={32} />
          <p>
            {mode === 'magic'
              ? <>Check your inbox — we sent a sign-in link to<br /><strong>{email}</strong></>
              : mode === 'reset'
              ? <>Check your inbox — we sent a password reset link to<br /><strong>{email}</strong></>
              : <>Check your inbox to confirm <strong>{email}</strong>, then sign in.</>}
          </p>
          <button className="btn-secondary" onClick={() => { setSent(false); setMode('signin'); }}>Back to Sign In</button>
        </div>
      ) : (
        <>
          {GOOGLE_AUTH_ENABLED && (
            <>
              <button className="btn-google btn-block" onClick={handleGoogle} type="button">
                <GoogleIcon /> Continue with Google
              </button>
              <div className="auth-divider"><span>or</span></div>
            </>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-label"><Mail size={16} /> Email</label>
            <input
              type="email" placeholder="you@example.com" value={email} autoFocus
              onChange={(e) => setEmail(e.target.value)}
            />

            {mode !== 'magic' && mode !== 'reset' && (
              <>
                <label className="auth-label"><Lock size={16} /> Password</label>
                <input
                  type="password" placeholder="Your password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {mode === 'signup' && (
                  <>
                    <label className="auth-label"><Lock size={16} /> Confirm Password</label>
                    <input
                      type="password" placeholder="Type it again" value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </>
                )}
                {mode === 'signin' && (
                  <button
                    type="button" className="auth-forgot"
                    onClick={() => { setMode('reset'); setError(''); }}
                  >
                    Forgot password?
                  </button>
                )}
              </>
            )}

            {error && <p className="auth-error">{error}</p>}

            <button className="btn-primary btn-block" type="submit" disabled={loading}>
              {loading
                ? 'Please wait…'
                : mode === 'signup' ? 'Create Account'
                : mode === 'magic' ? 'Send Sign-In Link'
                : mode === 'reset' ? 'Send Reset Link'
                : 'Sign In'}
            </button>
          </form>

          <div className="auth-switch">
            {mode === 'signin' && (
              <>
                <button onClick={() => { setMode('signup'); setError(''); }}>Create an account</button>
                <button onClick={() => { setMode('magic'); setError(''); }}>Email me a link instead</button>
              </>
            )}
            {mode === 'signup' && (
              <button onClick={() => { setMode('signin'); setError(''); }}>Already have an account? Sign in</button>
            )}
            {mode === 'reset' && (
              <button onClick={() => { setMode('signin'); setError(''); }}>Back to Sign In</button>
            )}
            {mode === 'magic' && (
              <button onClick={() => { setMode('signin'); setError(''); }}>Use a password instead</button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function CreateProfile({ onCreate }) {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!clean) { setError('Choose a username using letters, numbers, or underscores.'); return; }
    setLoading(true);
    setError('');
    const { error } = await onCreate(clean, displayName.trim());
    setLoading(false);
    if (error) {
      setError(error.code === '23505' ? 'That username is already taken.' : error.message);
    }
  };

  return (
    <div className="auth-screen">
      <img src="/logo-header.png" alt="Perfect Flow" className="auth-logo" />
      <h1>Set Up Your Profile</h1>
      <p className="auth-tagline">This is how other musicians will find you.</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-label">Username</label>
        <input
          type="text" placeholder="e.g. johncruz" value={username} autoFocus
          onChange={(e) => setUsername(e.target.value)}
        />
        <label className="auth-label">Display Name (optional)</label>
        <input
          type="text" placeholder="e.g. John Cruz" value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        {error && <p className="auth-error">{error}</p>}
        <button className="btn-primary btn-block" type="submit" disabled={loading}>
          {loading ? 'Creating…' : 'Continue'}
        </button>
      </form>
    </div>
  );
}

export function ResetPassword({ onUpdatePassword }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    setError('');
    const { error } = await onUpdatePassword(password);
    setLoading(false);
    if (error) setError(error.message);
  };

  return (
    <div className="auth-screen">
      <img src="/logo-header.png" alt="Perfect Flow" className="auth-logo" />
      <h1>Set a New Password</h1>
      <p className="auth-tagline">Choose whatever you like — you'll use this to sign in from now on.</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-label"><Lock size={16} /> New Password</label>
        <input
          type="password" placeholder="New password" value={password} autoFocus
          onChange={(e) => setPassword(e.target.value)}
        />
        <label className="auth-label"><Lock size={16} /> Confirm Password</label>
        <input
          type="password" placeholder="Type it again" value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {error && <p className="auth-error">{error}</p>}
        <button className="btn-primary btn-block" type="submit" disabled={loading}>
          {loading ? 'Updating…' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}

export function SupabaseNotConfigured() {
  return (
    <div className="auth-screen">
      <img src="/logo-header.png" alt="Perfect Flow" className="auth-logo" />
      <h1>Almost there</h1>
      <p className="auth-tagline">Cloud sync isn't configured yet</p>
      <p className="section-hint" style={{ textAlign: 'center', maxWidth: 320 }}>
        Add your Supabase anon key to the <code>.env</code> file, then rebuild the app
        (<code>npm run build</code>) to enable accounts and shared songs.
      </p>
    </div>
  );
}
