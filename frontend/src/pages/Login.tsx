import { FormEvent, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as { from?: Location })?.from?.pathname || '/';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login({ username, password });
      navigate(from, { replace: true });
    } catch {
      setError('ログインに失敗しました。ユーザー名とパスワードを確認してください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-wrap">
      <div className="panel auth-panel">
        <p className="eyebrow">おかえりなさい</p>
        <h2>ログイン</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            ユーザー名
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus required />
          </label>
          <label>
            パスワード
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error && <p className="feedback">{error}</p>}
          <button type="submit" className="button" disabled={isSubmitting}>
            {isSubmitting ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
        <p>はじめての方は <Link to="/register">アカウントを作成</Link></p>
      </div>
    </section>
  );
}

export default Login;
