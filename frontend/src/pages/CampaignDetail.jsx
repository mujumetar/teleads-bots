import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Eye,
  MousePointer,
  Calendar,
  Hash,
} from 'lucide-react';
import StatsCard from '../components/StatsCard';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';

const statusStyles = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  completed: 'bg-slate-100 text-slate-600 border-slate-200',
  paused: 'bg-slate-100 text-slate-600 border-slate-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/campaigns/${id}`)
      .then((res) => setCampaign(res.data))
      .catch(() => navigate('/campaigns'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <LoadingSpinner label="Loading campaign…" />;
  if (!campaign) return null;

  const progress =
    campaign.budget > 0
      ? Math.min((campaign.budgetSpent / campaign.budget) * 100, 100)
      : 0;
  const st = statusStyles[campaign.status] || statusStyles.pending;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 mb-20 space-y-10 animate-fade-in">
      <PageHeader
        badge="Campaign"
        title={campaign.name}
        description={
          <>
            Created {new Date(campaign.createdAt).toLocaleDateString(undefined, {
              dateStyle: 'medium',
            })}
          </>
        }
      >
        <Link to="/campaigns" className="pro-btn-secondary">
          <ArrowLeft size={16} />
          Back to campaigns
        </Link>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center rounded-lg border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${st}`}>
          {campaign.status}
        </span>
        {campaign.niche && (
          <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
            <Hash className="h-3 w-3" />
            {campaign.niche}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          icon={<DollarSign size={22} />}
          label="Budget"
          value={`₹${Number(campaign.budget || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          color="blue"
        />
        <StatsCard
          icon={<TrendingUp size={22} />}
          label="Spent"
          value={`₹${Number(campaign.budgetSpent || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          color="amber"
        />
        <StatsCard
          icon={<Eye size={22} />}
          label="Impressions"
          value={(campaign.totalImpressions || 0).toLocaleString()}
          color="purple"
        />
        <StatsCard
          icon={<MousePointer size={22} />}
          label="Clicks"
          value={(campaign.totalClicks || 0).toLocaleString()}
          color="emerald"
        />
      </div>

      <section className="pro-card p-6 sm:p-8">
        <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4">
          Budget usage
        </h2>
        <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-600">
          {progress.toFixed(1)}% of budget used
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="pro-card p-6 sm:p-8 flex flex-col">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Ad copy</h2>
          <pre className="whitespace-pre-wrap text-sm font-medium text-slate-700 leading-relaxed bg-slate-50/80 rounded-xl p-4 border border-slate-100 flex-1">
            {campaign.adText || '—'}
          </pre>
          {campaign.trackingUrl && (
            <p className="mt-4 text-sm">
              <span className="font-bold text-slate-500">Link: </span>
              <a
                href={campaign.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline break-all"
              >
                {campaign.trackingUrl}
              </a>
            </p>
          )}
        </section>

        <section className="pro-card p-6 sm:p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Details</h2>
          <dl className="space-y-4">
            <div className="flex justify-between gap-4 py-3 border-b border-slate-100">
              <dt className="text-sm font-semibold text-slate-500">Cost per post</dt>
              <dd className="text-sm font-bold text-slate-900">
                ₹{campaign.costPerPost ?? '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-3 border-b border-slate-100">
              <dt className="text-sm font-semibold text-slate-500 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                Start
              </dt>
              <dd className="text-sm font-bold text-slate-900">
                {campaign.startDate
                  ? new Date(campaign.startDate).toLocaleDateString()
                  : 'Not set'}
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-3 border-b border-slate-100">
              <dt className="text-sm font-semibold text-slate-500">End</dt>
              <dd className="text-sm font-bold text-slate-900">
                {campaign.endDate
                  ? new Date(campaign.endDate).toLocaleDateString()
                  : 'Not set'}
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-sm font-semibold text-slate-500">Target groups</dt>
              <dd className="text-sm font-bold text-slate-900 text-right">
                {campaign.targetGroups?.length
                  ? `${campaign.targetGroups.length} selected`
                  : 'All eligible groups'}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
