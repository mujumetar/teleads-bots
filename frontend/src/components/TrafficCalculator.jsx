import { useState, useEffect } from 'react';
import { Calculator, TrendingUp, Users, Zap, Info, ArrowRight } from 'lucide-react';

const NICHES = [
  { name: 'Technology', multiplier: 1.5, icon: '💻' },
  { name: 'Crypto/Finance', multiplier: 2.5, icon: '💎' },
  { name: 'Lifestyle/Entertainment', multiplier: 1.0, icon: '🎉' },
  { name: 'Education/News', multiplier: 1.2, icon: '📚' },
  { name: 'Gaming', multiplier: 1.3, icon: '🎮' },
];

export default function TrafficCalculator() {
  const [members, setMembers] = useState(5000);
  const [niche, setNiche] = useState(NICHES[0]);
  const [frequency, setFrequency] = useState(3); // posts per day
  const [result, setResult] = useState({ daily: 0, monthly: 0, reach: 0 });

  const BASE_CPM = 12; // INR per 1000 views

  useEffect(() => {
    // Estimations:
    // Avg reach = 15% of members per post
    const avgReachPerPost = Math.floor(members * 0.15);
    const totalDailyViews = avgReachPerPost * frequency;
    
    // Earnings calculation
    const dailyEarnings = (totalDailyViews / 1000) * BASE_CPM * niche.multiplier;
    const monthlyEarnings = dailyEarnings * 30;

    setResult({
      daily: dailyEarnings.toFixed(2),
      monthly: monthlyEarnings.toFixed(2),
      reach: totalDailyViews.toLocaleString()
    });
  }, [members, niche, frequency]);

  return (
    <section className="pro-card relative overflow-hidden group">
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 p-12 text-slate-50 opacity-20 -rotate-12 group-hover:rotate-0 transition-transform duration-1000 pointer-events-none">
        <Calculator size={160} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-10">
           <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-xl shadow-primary/20">
             <TrendingUp size={28} />
           </div>
           <div>
             <h2 className="text-3xl font-black text-slate-900 tracking-tight">Yield Predictor</h2>
             <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Publisher Revenue Estimator v1.2</p>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Users size={12} />
                  Node Capacity (Members)
                </label>
                <span className="text-primary font-black">{members.toLocaleString()}</span>
              </div>
              <input 
                type="range" 
                min="500" 
                max="100000" 
                step="500" 
                value={members} 
                onChange={(e) => setMembers(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Niche Specialization</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {NICHES.map((n) => (
                  <button
                    key={n.name}
                    onClick={() => setNiche(n)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all font-bold text-xs ${
                      niche.name === n.name 
                        ? 'border-primary bg-primary/5 text-primary shadow-sm' 
                        : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    <span className="text-xl">{n.icon}</span>
                    <span className="truncate w-full text-center">{n.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Zap size={12} />
                  Cycle Frequency (Ads/Day)
                </label>
                <span className="text-emerald-600 font-black">{frequency} Posts</span>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 6].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFrequency(f)}
                    className={`flex-1 py-3 rounded-xl border-2 font-black text-sm transition-all ${
                      frequency === f 
                        ? 'bg-slate-900 border-slate-900 text-white' 
                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[400px]">
             {/* Abstract Grid Path - teleads.pro style */}
             <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>
             
             <div>
                <div className="flex items-center gap-2 text-primary/80 font-black text-[10px] uppercase tracking-[0.2em] mb-8">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  Revenue projection
                </div>

                <div className="space-y-10">
                   <div>
                      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">Estimated Monthly Yield</p>
                      <h3 className="text-6xl font-black tracking-tight flex items-baseline gap-1">
                        <span className="text-primary">₹</span>
                        {result.monthly}
                      </h3>
                   </div>

                   <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-10">
                      <div>
                         <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.15em] mb-1">Daily REACH</p>
                         <p className="text-2xl font-black">{result.reach}</p>
                      </div>
                      <div>
                         <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.15em] mb-1">Base CPM</p>
                         <p className="text-2xl font-black">₹{BASE_CPM * niche.multiplier}</p>
                      </div>
                   </div>
                </div>
             </div>

             <div className="mt-12 flex items-center justify-between">
                <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
                   <Info size={14} className="text-primary" />
                   <span className="text-[10px] font-bold text-slate-400">Estimates based on 15% active engagement</span>
                </div>
                <button className="w-12 h-12 rounded-full bg-white text-slate-900 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl">
                   <ArrowRight size={20} />
                </button>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
