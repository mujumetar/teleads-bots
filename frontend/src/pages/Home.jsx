import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Globe, BadgeCheck, Shield, ArrowRight } from 'lucide-react';

/* ── Hero visual (kept self-contained for animation) ── */
const HeroScene = () => (
  <div className="relative w-full min-h-[420px] lg:min-h-[520px] flex items-center justify-center select-none">
    <div
      className="absolute w-[420px] h-[420px] rounded-full opacity-70 float-animation"
      style={{
        background: 'radial-gradient(circle at 35% 40%, #c7d2fe 0%, #e0e7ff 55%, transparent 80%)',
        filter: 'blur(40px)',
      }}
    />
    <div
      className="absolute w-[280px] h-[280px] rounded-full opacity-50"
      style={{
        background: 'radial-gradient(circle at 60% 55%, #a7f3d0 0%, #d1fae5 60%, transparent 85%)',
        filter: 'blur(50px)',
        top: '55%',
        left: '55%',
        animation: 'float 11s ease-in-out infinite reverse',
      }}
    />

    <div
      className="relative z-10 w-[220px] h-[220px] sm:w-[260px] sm:h-[260px] rounded-full flex items-center justify-center float-animation"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(224,231,255,0.55) 60%, rgba(209,250,229,0.35) 100%)',
        border: '1.5px solid rgba(255,255,255,0.95)',
        boxShadow: '0 20px 80px rgba(67, 56, 202, 0.15), inset 0 1px 0 rgba(255,255,255,0.9)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="text-center px-4">
        <div className="text-5xl leading-none mb-2">📡</div>
        <div className="font-extrabold text-xs text-primary tracking-[0.2em] uppercase">TeleAds</div>
        <div className="font-semibold text-[10px] text-slate-400 tracking-widest uppercase mt-1">
          Impression-based
        </div>
      </div>
    </div>

    {[
      { emoji: '₹', label: '₹80–150', sub: 'CPM band', color: '#0d9488', top: '8%', left: '6%', delay: '0s' },
      { emoji: '📢', label: 'Campaigns', sub: 'Budget caps', color: '#4338ca', top: '10%', right: '4%', delay: '1.5s' },
      { emoji: '👥', label: '65%+', sub: 'To publishers', color: '#d97706', bottom: '12%', left: '4%', delay: '0.8s' },
      { emoji: '✓', label: 'Verified', sub: 'Groups', color: '#059669', bottom: '8%', right: '6%', delay: '2.2s' },
    ].map((card, i) => (
      <div
        key={i}
        className="absolute z-20 float-animation min-w-[100px] sm:min-w-[110px] rounded-2xl px-4 py-3 bg-white/80 backdrop-blur-md border border-white/90 shadow-lg"
        style={{
          top: card.top,
          left: card.left,
          right: card.right,
          bottom: card.bottom,
          animationDelay: card.delay,
        }}
      >
        <div className="text-xl mb-1">{card.emoji}</div>
        <div className="font-extrabold text-base" style={{ color: card.color }}>
          {card.label}
        </div>
        <div className="font-semibold text-[10px] text-slate-400 uppercase tracking-wider">{card.sub}</div>
      </div>
    ))}
  </div>
);

const FeatureCard = ({ icon: Icon, title, description, color }) => (
  <div className="pro-card p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-default group">
    <div
      className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-[1.03]"
      style={{ background: `${color}18`, color }}
    >
      <Icon size={26} />
    </div>
    <h3 className="font-bold text-lg text-slate-900 mb-2 tracking-tight">{title}</h3>
    <p className="text-slate-600 text-sm font-medium leading-relaxed">{description}</p>
  </div>
);

const StatItem = ({ value, label }) => (
  <div>
    <div className="text-3xl font-extrabold text-slate-900 leading-none tracking-tight">{value}</div>
    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-2">{label}</div>
  </div>
);

const Home = () => {
  return (
    <div className="min-h-screen app-shell-bg overflow-x-hidden font-sans text-slate-900">
      <nav className="fixed top-0 w-full z-50 px-4 sm:px-6 pt-4 sm:pt-5">
        <div className="max-w-6xl mx-auto flex justify-between items-center gap-4 rounded-full border border-black/[0.07] bg-white/75 backdrop-blur-xl px-4 sm:px-6 py-2.5 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-extrabold text-sm shadow-md shadow-primary/25 shrink-0">
              T
            </div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900 truncate">TeleAds</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
              Sign in
            </Link>
            <Link
              to="/register"
              className="pro-btn-primary rounded-full text-xs sm:text-sm py-2.5 px-4 sm:px-5"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-12 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        <div className="order-2 lg:order-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 mb-6">
            <Zap size={14} className="text-primary shrink-0" fill="currentColor" />
            <span className="font-extrabold text-[10px] sm:text-[11px] text-primary uppercase tracking-[0.12em]">
              CPM · Telegram groups & channels
            </span>
          </div>

          <h1 className="text-[clamp(1.875rem,5vw,3.25rem)] font-extrabold leading-[1.12] tracking-tight text-slate-900 mb-6">
            Ads priced on{' '}
            <span className="bg-gradient-to-br from-primary to-violet-500 bg-clip-text text-transparent">
              real impressions.
            </span>
          </h1>

          <p className="text-lg text-slate-600 font-medium leading-relaxed mb-8 max-w-lg">
            One account for advertisers and group owners: run campaigns, track views, split revenue fairly. Built for
            scale — start with fixed CPM, manual approvals, then automate placement.
          </p>

          <div className="flex flex-wrap gap-3 mb-10">
            <Link
              to="/register"
              className="pro-btn-primary rounded-2xl px-6 py-3.5 text-sm shadow-lg shadow-primary/20 inline-flex items-center gap-2"
            >
              Create account <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="pro-btn-secondary rounded-2xl px-6 py-3.5 text-sm">
              Sign in
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-6 sm:gap-8 pt-8 border-t border-black/[0.06]">
            <StatItem value="₹80–150" label="CPM (₹)" />
            <StatItem value="60–70%" label="Publisher share" />
            <StatItem value="Views" label="Primary signal" />
          </div>
        </div>

        <div className="order-1 lg:order-2 flex justify-center">
          <HeroScene />
        </div>
      </section>

      <section className="border-t border-black/[0.05] bg-white/40 backdrop-blur-sm py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-14 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
              Everything in one network
            </h2>
            <p className="text-slate-600 font-medium leading-relaxed">
              Advertisers buy reach; publishers monetize members. Operations and superadmin tools stay on the same
              stack — wallets, approvals, fraud checks, and analytics.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            <FeatureCard
              icon={Globe}
              color="#4338ca"
              title="Targeted placement"
              description="Categories, niches, or hand-picked groups — then graduate to auto-placement when your data is strong enough."
            />
            <FeatureCard
              icon={BadgeCheck}
              color="#0d9488"
              title="Honest numbers"
              description="Message views when available; sensible fallbacks when the API does not expose them — so CPM math stays explainable."
            />
            <FeatureCard
              icon={Shield}
              color="#d97706"
              title="Wallets & payouts"
              description="Separate spend and earnings flows, with room for Razorpay and admin controls as you grow."
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
