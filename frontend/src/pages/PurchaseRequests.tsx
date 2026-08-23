import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  approveRequest,
  cancelRequest,
  confirmReceipt,
  createPurchaseRequest,
  fetchExchangeRate,
  fetchPurchaseRequests,
  handOverRequest,
  rejectRequest,
} from '../api/purchaseRequests';
import { ExchangeRateInfo, PurchaseRequest, PurchaseRequestStatus } from '../types';

const STATUS_LABEL: Record<PurchaseRequestStatus, string> = {
  REQUESTED: '申請中',
  APPROVED: '承認済み・受け渡し待ち',
  REJECTED: '却下',
  HANDED_OVER: '受け渡し済み・受取確認待ち',
  RECEIVED: '受け取り完了',
  CANCELLED: 'キャンセル',
};

const STATUS_CLASS: Record<PurchaseRequestStatus, string> = {
  REQUESTED: 'tag muted',
  APPROVED: 'tag success',
  REJECTED: 'tag danger',
  HANDED_OVER: 'tag success',
  RECEIVED: 'tag success',
  CANCELLED: 'tag muted',
};

function PurchaseRequests() {
  const { user } = useAuth();
  const isChild = user?.role === 'CHILD';

  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [rateInfo, setRateInfo] = useState<ExchangeRateInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionError, setActionError] = useState('');

  const [pointsCost, setPointsCost] = useState('');
  const [memo, setMemo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [requestList, rate] = await Promise.all([
        fetchPurchaseRequests(),
        isChild ? fetchExchangeRate() : Promise.resolve(null),
      ]);
      setRequests(requestList);
      setRateInfo(rate);
    } catch {
      setErrorMessage('データを読み込めませんでした。');
    } finally {
      setIsLoading(false);
    }
  }, [isChild]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionError('');
    const parsed = Number(pointsCost);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      setActionError('ポイント数は1以上の整数で入力してください。');
      return;
    }
    setIsSubmitting(true);
    try {
      await createPurchaseRequest(parsed, memo || undefined);
      setPointsCost('');
      setMemo('');
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '申請に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const runAction = async (action: () => Promise<PurchaseRequest>) => {
    setActionError('');
    try {
      await action();
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '操作に失敗しました。');
    }
  };

  const previewCash = rateInfo && Number.isInteger(Number(pointsCost)) && Number(pointsCost) > 0
    ? Math.round(Number(pointsCost) * rateInfo.rate)
    : null;

  return (
    <section className="page-stack">
      <div className="panel">
        <p className="eyebrow">おこづかい交換</p>
        <h2>ポイントを現金に交換する</h2>
        {errorMessage && <p className="feedback">{errorMessage}</p>}
      </div>

      {isChild && (
        <div className="panel">
          {rateInfo && (
            <div className="stat-grid">
              <div className="stat-card">
                <span>現在のレート</span>
                <strong>1pt = {rateInfo.rate}円</strong>
              </div>
              <div className="stat-card">
                <span>直近の正答率</span>
                <strong>{Math.round(rateInfo.recentAccuracy * 100)}%</strong>
              </div>
              <div className="stat-card">
                <span>交換可能ポイント</span>
                <strong>{rateInfo.availablePoints}pt</strong>
              </div>
            </div>
          )}
          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              交換するポイント数
              <input
                type="number"
                min={1}
                value={pointsCost}
                onChange={(e) => setPointsCost(e.target.value)}
                required
              />
            </label>
            <label>
              メモ(任意)
              <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="例: 欲しいもの" />
            </label>
            {previewCash !== null && <p className="hint">受け取り予定額: {previewCash}円</p>}
            {actionError && <p className="feedback">{actionError}</p>}
            <button className="button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? '申請中...' : '申請する'}
            </button>
          </form>
        </div>
      )}

      <div className="panel">
        <h3>{isChild ? '自分の申請一覧' : '子供からの申請一覧'}</h3>
        {isLoading ? (
          <p>読み込み中...</p>
        ) : requests.length === 0 ? (
          <p>申請はまだありません。</p>
        ) : (
          <ul className="request-list">
            {requests.map((request) => (
              <li key={request.id} className="request-card">
                <div className="card-header">
                  <span className={STATUS_CLASS[request.status]}>{STATUS_LABEL[request.status]}</span>
                  <span className="tag muted">
                    {isChild ? request.parent.username : request.child.username}
                  </span>
                </div>
                <p>{request.pointsCost}pt → {request.cashAmount}円(レート {request.rate})</p>
                {request.memo && <p className="hint">メモ: {request.memo}</p>}
                {request.rejectReason && <p className="hint">却下理由: {request.rejectReason}</p>}
                <p className="hint">申請日時: {new Date(request.requestedAt).toLocaleString()}</p>

                <div className="card-actions">
                  {!isChild && request.status === 'REQUESTED' && (
                    <>
                      <button className="button" type="button" onClick={() => runAction(() => approveRequest(request.id))}>
                        承認する
                      </button>
                      <button className="button secondary" type="button" onClick={() => runAction(() => rejectRequest(request.id))}>
                        却下する
                      </button>
                    </>
                  )}
                  {!isChild && request.status === 'APPROVED' && (
                    <button className="button" type="button" onClick={() => runAction(() => handOverRequest(request.id))}>
                      渡した
                    </button>
                  )}
                  {isChild && request.status === 'REQUESTED' && (
                    <button className="button secondary" type="button" onClick={() => runAction(() => cancelRequest(request.id))}>
                      キャンセル
                    </button>
                  )}
                  {isChild && request.status === 'HANDED_OVER' && (
                    <button className="button" type="button" onClick={() => runAction(() => confirmReceipt(request.id))}>
                      受け取りました
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default PurchaseRequests;
