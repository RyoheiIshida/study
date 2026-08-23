import { FormEvent, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('CHILD');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await register({ username, password, role });
      navigate('/', { replace: true });
    } catch {
      setError('登録に失敗しました。別のユーザー名をお試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-wrap">
      <div className="panel auth-panel">
        <p className="eyebrow">記録を始めよう</p>
        <h2>アカウント作成</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            ユーザー名
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus required />
          </label>
          <label>
            パスワード
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
          </label>
          <fieldset className="role-select">
            <legend>アカウント種別</legend>
            <label className="role-option">
              <input type="radio" name="role" value="CHILD" checked={role === 'CHILD'} onChange={() => setRole('CHILD')} />
              子供
            </label>
            <label className="role-option">
              <input type="radio" name="role" value="PARENT" checked={role === 'PARENT'} onChange={() => setRole('PARENT')} />
              親
            </label>
          </fieldset>
          {error && <p className="feedback">{error}</p>}
          <button type="submit" className="button" disabled={isSubmitting}>
            {isSubmitting ? '作成中...' : '登録'}
          </button>
        </form>
        <p>すでにアカウントをお持ちの方は <Link to="/login">ログイン</Link></p>
      </div>
    </section>
  );
}

export default Register;
