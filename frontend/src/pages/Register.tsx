import { FormEvent, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await register({ username, password });
      navigate('/', { replace: true });
    } catch {
      setError('Registration failed. Try a different username.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-wrap">
      <div className="panel auth-panel">
        <p className="eyebrow">Start tracking</p>
        <h2>Create account</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
          </label>
          {error && <p className="feedback">{error}</p>}
          <button type="submit" className="button" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Register'}
          </button>
        </form>
        <p>Already have an account? <Link to="/login">Log in</Link></p>
      </div>
    </section>
  );
}

export default Register;
