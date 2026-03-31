import { Link } from 'react-router-dom';
import { Megaphone, Users, Shield, ArrowRight, CheckCircle, TrendingUp, Zap, Globe, Bot, ChevronRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-50 selection:text-indigo-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold">T</div>
            <span className="font-bold text-lg tracking-tight">TeleAds</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Log in</Link>
            <Link to="/register" className="pro-btn-primary px-5 py-2.5 !rounded-xl !shadow-none">Sign up free</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-40 pb-20 px-6 max-w-7xl mx-auto text-center space-y-10 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-widest">
           <Zap size={14} className="text-amber-500" /> V2.0 Protocol is Live
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight max-w-4xl mx-auto leading-[1.1]">
          The Professional Ad Network for <span className="text-indigo-600">Telegram</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
          Scale your business on the world's most innovative messaging platform. 
          Target by niche, track ROI in real-time, and automate your yields.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
          <Link to="/register" className="pro-btn-primary w-full sm:w-auto px-10 py-5 text-base">
            Start Growing Now
            <ArrowRight size={20} />
          </Link>
          <button className="pro-btn-secondary w-full sm:w-auto px-10 py-5 text-base border-transparent hover:bg-slate-50">
            View Analytics Matrix
          </button>
        </div>

        <div className="flex items-center justify-center gap-10 pt-10 text-slate-300 opacity-80">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            <Users size={14} /> 5K+ Partners
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            <Globe size={14} /> Global Reach
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
             <Shield size={14} /> Verified Nodes
          </div>
        </div>
      </header>

      {/* Social Proof / Preview */}
      <section className="px-6 py-20 bg-slate-50/50 border-y border-slate-100">
         <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="pro-card border-slate-100/50 shadow-xl shadow-slate-200/20">
               <TrendingUp className="text-indigo-600 mb-6" size={32} />
               <h3 className="text-xl font-bold mb-3">Precision Targeting</h3>
               <p className="text-slate-500 text-sm font-medium leading-relaxed">
                 Target channels by precise niche, population size, and engagement rates. Stop wasting budget on bot traffic.
               </p>
            </div>
            <div className="pro-card border-slate-100/50 shadow-xl shadow-slate-200/20">
               <Zap className="text-amber-500 mb-6" size={32} />
               <h3 className="text-xl font-bold mb-3">Automated Yields</h3>
               <p className="text-slate-500 text-sm font-medium leading-relaxed">
                 Seamlessly automate ad cycles with our proprietary bot protocol. Payouts are reconciled in real-time.
               </p>
            </div>
            <div className="pro-card border-slate-100/50 shadow-xl shadow-slate-200/20">
               <Bot className="text-emerald-500 mb-6" size={32} />
               <h3 className="text-xl font-bold mb-3">Private Governance</h3>
               <p className="text-slate-500 text-sm font-medium leading-relaxed">
                 All telemetries and confirmations are channeled privately to your PM. Maintain a clean, professional group.
               </p>
            </div>
         </div>
      </section>

      {/* Simplified CTA */}
      <section className="py-32 px-6 text-center max-w-4xl mx-auto space-y-8">
         <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Ready to integrate?</h2>
         <p className="text-slate-500 font-medium">Join 500+ successful publishers already monetizing their Telegram assets.</p>
         <Link to="/register" className="pro-btn-primary px-10 py-5 text-base">
           Enroll Platform Node
         </Link>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-2 grayscale opacity-50">
             <div className="w-6 h-6 bg-slate-900 text-white rounded flex items-center justify-center font-bold text-xs">T</div>
             <span className="font-bold text-sm">TeleAds</span>
           </div>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
             © 2026 TeleAds Protocol. All Rights Reserved.
           </p>
        </div>
      </footer>
    </div>
  );
}
