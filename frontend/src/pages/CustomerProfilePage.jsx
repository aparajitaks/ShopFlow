import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { format } from 'date-fns';
import {
  ArrowLeft, ChevronRight, RefreshCw, ClipboardList,
  CheckCircle, AlertTriangle, UserX,
} from 'lucide-react';
import Layout from '../components/Layout';
import TrustOrb from '../components/TrustOrb/TrustOrb';
import RiskBadge from '../components/RiskBadge';
import FraudAlertBanner from '../components/FraudAlertBanner';
import ScoreBreakdownChart from '../components/ScoreBreakdownChart';
import RecalculateForm from '../components/RecalculateForm';
import HistoryTable from '../components/HistoryTable';
import { useLatestScore, useScoreHistory, useSubmitScore } from '../hooks/useTrustScore';

// ── Skeleton loaders ─────────────────────────────────────────────────────────

function OrbSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="skeleton w-72 h-72 rounded-full" />
      <div className="skeleton w-28 h-6 rounded-full" />
    </div>
  );
}

function BreakdownSkeleton() {
  return (
    <div className="space-y-3">
      {[40, 60, 50, 35, 25].map((w, i) => (
        <div key={i} className="flex gap-3 items-center">
          <div className="skeleton h-3 rounded-full" style={{ width: `${w}%` }} />
        </div>
      ))}
    </div>
  );
}

// ── First-time / never-scored state ─────────────────────────────────────────

function NeverScoredState({ customerId }) {
  return (
    <div className="card p-10 flex flex-col items-center text-center max-w-md mx-auto">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <UserX className="w-8 h-8 text-gray-400" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-bold text-gray-800">No Trust Score Yet</h2>
      <p className="text-sm text-gray-500 mt-2 leading-relaxed">
        <span className="font-mono font-semibold text-gray-700">{customerId}</span> has never been
        scored. Fill in the order metrics below to generate their first COD trust score.
      </p>
      <div className="mt-3 flex items-center gap-1.5 text-xs text-brand-600 font-medium">
        <ChevronRight size={14} />
        Use the "Recalculate Score" form below
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function CustomerProfilePage() {
  const { customerId } = useParams();
  const [submitError, setSubmitError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const {
    data: latestScore,
    isLoading: latestLoading,
    isError: latestError,
    error: latestErrorObj,
    refetch: refetchLatest,
  } = useLatestScore(customerId);

  const {
    data: historyData,
    isLoading: historyLoading,
  } = useScoreHistory(customerId);

  const submitScore = useSubmitScore();

  const handleRecalculate = async (payload) => {
    setSubmitError(null);
    setSuccessMessage(null);
    try {
      await submitScore.mutateAsync(payload);
      setSuccessMessage('Score recalculated successfully.');
    } catch (err) {
      const msg = err?.friendlyMessage || err?.response?.data?.error || 'Failed to calculate score.';
      setSubmitError(msg);
      throw err; // re-throw so RecalculateForm can map field errors
    }
  };

  const historyRecords = historyData?.history ?? [];

  return (
    <Layout>
      <div className="space-y-6 animate-slide-up">
        {/* ── Breadcrumb ──────────────────────────────────────────────── */}
        <nav className="flex items-center gap-2 text-sm text-gray-500" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-brand-600 transition-colors flex items-center gap-1">
            <ArrowLeft size={14} />
            Dashboard
          </Link>
          <ChevronRight size={14} className="text-gray-300" />
          <span className="font-mono font-semibold text-gray-800">{customerId}</span>
        </nav>

        {/* ── Customer header ─────────────────────────────────────────── */}
        <div className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Customer ID</p>
            <h1 className="text-2xl font-black font-mono text-gray-900 mt-0.5">{customerId}</h1>
            {latestScore?.created_at && (
              <p className="text-sm text-gray-500 mt-1">
                Last scored:{' '}
                <span className="font-medium text-gray-700">
                  {format(new Date(latestScore.created_at), 'MMM d, yyyy · HH:mm')}
                </span>
              </p>
            )}
          </div>
          {latestScore && (
            <div className="flex items-center gap-3">
              <RiskBadge riskLevel={latestScore.risk_level} fraudFlag={latestScore.fraud_flag} size="lg" />
            </div>
          )}
        </div>

        {/* ── Network error ───────────────────────────────────────────── */}
        {latestError && latestErrorObj?.response?.status !== 404 && (
          <div
            className="card border-red-200 bg-red-50 p-5 flex items-start gap-3"
            role="alert"
          >
            <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold text-red-800">Failed to load score</p>
              <p className="text-sm text-red-600 mt-0.5">
                {latestErrorObj?.friendlyMessage || 'Network error. Please try again.'}
              </p>
              <button
                onClick={() => refetchLatest()}
                className="text-sm text-red-700 font-medium mt-2 flex items-center gap-1 hover:underline"
              >
                <RefreshCw size={13} /> Retry
              </button>
            </div>
          </div>
        )}

        {/* ── Fraud alert banner (full-width, sits above orb) ─────────── */}
        {latestScore?.fraud_flag && (
          <FraudAlertBanner reason={latestScore.fraud_reason} />
        )}

        {/* ── Never scored empty state ─────────────────────────────────── */}
        {!latestLoading && !latestError && latestScore === null && (
          <NeverScoredState customerId={customerId} />
        )}

        {/* ── Main content grid: Orb + Info ────────────────────────────── */}
        {(latestLoading || latestScore) && (
          <div className="card p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Left: 3D Orb */}
              <div className="flex-shrink-0">
                {latestLoading ? (
                  <OrbSkeleton />
                ) : latestScore ? (
                  <TrustOrb
                    score={latestScore.trust_score}
                    riskLevel={latestScore.risk_level}
                    fraudFlag={latestScore.fraud_flag}
                  />
                ) : null}
              </div>

              {/* Right: Score info — always in DOM for accessibility */}
              {latestScore && (
                <div className="flex-1 space-y-4" aria-label="Score details">
                  {/* DOM score — accessible fallback outside canvas */}
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Trust Score</p>
                    <div className="flex items-baseline gap-2">
                      <span
                        className="text-6xl font-black text-gray-900 leading-none tabular-nums"
                        aria-label={`Trust score: ${latestScore.trust_score} out of 100`}
                      >
                        {latestScore.trust_score}
                      </span>
                      <span className="text-xl text-gray-400 font-medium">/100</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1.5">Risk Level</p>
                    <RiskBadge
                      riskLevel={latestScore.risk_level}
                      fraudFlag={latestScore.fraud_flag}
                      size="lg"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Recommendation</p>
                    <div className="flex items-start gap-2">
                      {latestScore.fraud_flag ? (
                        <AlertTriangle className="text-red-500 mt-0.5 flex-shrink-0" size={16} />
                      ) : (
                        <CheckCircle className="text-emerald-500 mt-0.5 flex-shrink-0" size={16} />
                      )}
                      <p className="text-base font-semibold text-gray-800">
                        {latestScore.recommendation}
                      </p>
                    </div>
                  </div>

                  {/* Score total pill */}
                  <div className="pt-2">
                    <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2">
                      <div className="w-full bg-gray-200 rounded-full h-1.5 w-32">
                        <div
                          className="h-1.5 rounded-full bg-brand-600 transition-all duration-700"
                          style={{ width: `${latestScore.trust_score}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-600">
                        {latestScore.trust_score}/100
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Breakdown chart + Recalculate form ──────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Score breakdown */}
          <div className="card p-6">
            {latestLoading ? (
              <BreakdownSkeleton />
            ) : latestScore?.score_breakdown ? (
              <ScoreBreakdownChart breakdown={latestScore.score_breakdown} />
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <ClipboardList size={28} className="mb-2 opacity-40" />
                <p className="text-sm">No breakdown available yet.</p>
              </div>
            )}
          </div>

          {/* Recalculate form */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              {latestScore ? 'Recalculate Score' : 'Calculate First Score'}
            </h3>

            {/* Success toast */}
            {successMessage && (
              <div className="mb-4 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3" role="status">
                <CheckCircle size={15} />
                {successMessage}
              </div>
            )}

            <RecalculateForm
              customerId={customerId}
              onSubmit={handleRecalculate}
              isLoading={submitScore.isPending}
              serverError={submitError}
            />
          </div>
        </div>

        {/* ── History table ──────────────────────────────────────────── */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
            Score History
            {historyRecords.length > 0 && (
              <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {historyRecords.length}
              </span>
            )}
          </h3>

          {historyLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-10 rounded-lg" />
              ))}
            </div>
          ) : (
            <HistoryTable records={historyRecords} />
          )}
        </div>
      </div>
    </Layout>
  );
}
