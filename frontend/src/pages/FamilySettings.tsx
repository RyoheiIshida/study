import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createInvite, fetchFamilyInfo, linkFamily } from '../api/family';
import { FamilyInfo } from '../types';

function FamilySettings() {
  const { user } = useAuth();
  const [info, setInfo] = useState<FamilyInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [invite, setInvite] = useState<{ code: string; expiresAt: string } | null>(null);
  const [isInviting, setIsInviting] = useState(false);

  const [code, setCode] = useState('');
  const [linkError, setLinkError] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await fetchFamilyInfo();
      setInfo(data);
    } catch {
      setErrorMessage('家族情報を読み込めませんでした。');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleInvite = async () => {
    setIsInviting(true);
    try {
      const result = await createInvite();
      setInvite(result);
    } catch {
      setErrorMessage('招待コードを発行できませんでした。');
    } finally {
      setIsInviting(false);
    }
  };

  const handleLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLinkError('');
    setIsLinking(true);
    try {
      await linkFamily(code);
      setCode('');
      await load();
    } catch {
      setLinkError('コードが正しくないか、期限が切れています。');
    } finally {
      setIsLinking(false);
    }
  };

  if (isLoading) {
    return (
      <section className="page-stack">
        <div className="panel"><p>読み込み中...</p></div>
      </section>
    );
  }

  return (
    <section className="page-stack">
      <div className="panel">
        <p className="eyebrow">家族設定</p>
        <h2>{user?.role === 'PARENT' ? '子供のアカウントと連携する' : '親のアカウントと連携する'}</h2>
        {errorMessage && <p className="feedback">{errorMessage}</p>}
      </div>

      {info?.role === 'PARENT' && (
        <>
          <div className="panel">
            <h3>招待コードを発行</h3>
            <p className="hint">発行したコードを子供のアカウントに入力してもらうと連携されます(有効期限24時間)。</p>
            <button className="button" type="button" onClick={handleInvite} disabled={isInviting}>
              {isInviting ? '発行中...' : '招待コードを発行する'}
            </button>
            {invite && (
              <div className="invite-code-box">
                <span className="invite-code">{invite.code}</span>
                <span className="hint">有効期限: {new Date(invite.expiresAt).toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="panel">
            <h3>連携中の子供</h3>
            {info.children.length === 0 ? (
              <p>まだ連携されている子供はいません。</p>
            ) : (
              <ul className="family-member-list">
                {info.children.map((child) => (
                  <li key={child.username}>{child.username}</li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {info?.role === 'CHILD' && (
        <>
          <div className="panel">
            <h3>連携中の親</h3>
            {info.parent ? (
              <p><strong>{info.parent.username}</strong> と連携しています。</p>
            ) : (
              <p>まだ親アカウントと連携していません。親から受け取った招待コードを入力してください。</p>
            )}
          </div>

          <div className="panel">
            <h3>招待コードを入力</h3>
            <form className="auth-form" onSubmit={handleLink}>
              <label>
                招待コード
                <input value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} required />
              </label>
              {linkError && <p className="feedback">{linkError}</p>}
              <button className="button" type="submit" disabled={isLinking}>
                {isLinking ? '連携中...' : '連携する'}
              </button>
            </form>
          </div>
        </>
      )}
    </section>
  );
}

export default FamilySettings;
