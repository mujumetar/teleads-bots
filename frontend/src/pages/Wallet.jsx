import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Clock, Download, CheckCircle, XCircle, Plus, Wallet as WalletIcon,
  Smartphone, Landmark, History
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const cn = (...c) => c.filter(Boolean).join(' ');

const METHODS = [
  { id:'upi',  label:'UPI',          icon:Smartphone, hint:'Instant · 0% fee' },
  { id:'bank', label:'Bank Transfer', icon:Landmark,   hint:'1-2 business days' },
];

function TxRow({ tx }) {
  const credit = tx.type==='deposit'||tx.type==='earning';
  const statusCls = {
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    pending:   'bg-amber-100 text-amber-700 border-amber-200',
    rejected:  'bg-rose-100 text-rose-700 border-rose-200',
    failed:    'bg-rose-100 text-rose-700 border-rose-200',
  }[tx.status] || 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', credit?'bg-emerald-100 text-emerald-600':'bg-rose-100 text-rose-600')}>
            {credit ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700 capitalize">{tx.type}</p>
            <p className="text-[10px] text-slate-400">{tx.reference||'—'}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className={cn('text-sm font-black', credit?'text-emerald-600':'text-rose-600')}>
          {credit?'+':'-'}₹{parseFloat(tx.amount).toFixed(2)}
        </p>
      </td>
      <td className="px-4 py-3">
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase', statusCls)}>{tx.status}</span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-400">
        {new Date(tx.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
      </td>
    </tr>
  );
}

export default function Wallet() {
  const { user, activeRole } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [wForm, setWForm] = useState({ amount:'', method:'upi', details:'' });
  const [dForm, setDForm] = useState({ amount:'' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [txFilter, setTxFilter] = useState('all');

  const isPublisher = activeRole==='publisher';
  const balance = isPublisher ? (user?.publisherWallet||0) : (user?.advertiserWallet||0);
  const MIN = 1000;

  useEffect(()=>{
    api.get('/transactions').then(r=>setTransactions(r.data)).catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  const notify = (text, err=false) => { setToast({text,err}); setTimeout(()=>setToast(null),4000); };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if(parseFloat(wForm.amount)<MIN){notify(`Min withdrawal ₹${MIN}`,true);return;}
    if(parseFloat(wForm.amount)>balance){notify('Insufficient balance',true);return;}
    setSubmitting(true);
    try{ await api.post('/transactions/withdraw',wForm); notify('Withdrawal requested! ETA 24–48h.'); setShowWithdraw(false); setWForm({amount:'',method:'upi',details:''}); }
    catch(err){ notify(err.response?.data?.message||'Failed',true); }
    finally{ setSubmitting(false); }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    if(parseFloat(dForm.amount)<100){notify('Min deposit ₹100',true);return;}
    setSubmitting(true);
    try{ await api.post('/transactions/deposit',dForm); notify('Deposit initiated!'); setShowDeposit(false); }
    catch(err){ notify(err.response?.data?.message||'Failed',true); }
    finally{ setSubmitting(false); }
  };

  const totalIn  = transactions.filter(t=>t.type==='deposit'||t.type==='earning').reduce((s,t)=>s+(t.amount||0),0);
  const totalOut = transactions.filter(t=>t.type==='withdrawal'||t.type==='spend').reduce((s,t)=>s+(t.amount||0),0);
  const pending  = transactions.filter(t=>t.status==='pending').length;
  const filtered = txFilter==='all' ? transactions : transactions.filter(t=>t.type===txFilter);

  const inpCls = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 transition-all";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className={cn('fixed bottom-6 right-6 z-50 toast flex items-center gap-3', toast.err?'border border-rose-500/30':'')}>
          {toast.err ? <XCircle size={16} className="text-rose-400 shrink-0"/> : <CheckCircle size={16} className="text-emerald-400 shrink-0"/>}
          <span>{toast.text}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">{isPublisher?'Publisher Earnings':'Advertiser Wallet'}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{isPublisher?'Track earnings and request payouts.':'Manage your campaign budget and payment history.'}</p>
        </div>
      </div>

      {/* Balance cards */}
      <div className="grid sm:grid-cols-4 gap-4">
        <div className="sm:col-span-1 relative overflow-hidden rounded-2xl p-6" style={{background: isPublisher ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#6366f1,#4f46e5)'}}>
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/10"/>
          <p className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2">{isPublisher?'Publisher Wallet':'Advertiser Wallet'}</p>
          <p className="text-3xl font-black text-white tabular-nums">₹{balance.toFixed(2)}</p>
          <p className="text-white/60 text-xs mt-1 mb-5">Available {isPublisher?'for withdrawal':'for campaigns'}</p>
          <div className="flex gap-2">
            {isPublisher
              ? <button onClick={()=>setShowWithdraw(true)} disabled={balance<MIN} className="flex-1 py-2 bg-white text-emerald-700 rounded-xl text-xs font-black hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">Withdraw</button>
              : <button onClick={()=>setShowDeposit(true)} className="flex-1 py-2 bg-white text-indigo-700 rounded-xl text-xs font-black hover:bg-white/90 transition-all">Add Funds</button>}
            <button className="w-9 h-9 flex items-center justify-center bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all"><Download size={14}/></button>
          </div>
          {isPublisher && balance<MIN && <p className="text-white/60 text-[10px] mt-2 font-semibold">₹{(MIN-balance).toFixed(0)} more to unlock withdrawal</p>}
        </div>
        {[
          {l:'Total In',    v:`₹${totalIn.toFixed(2)}`,  icon:TrendingUp,   c:'text-emerald-600', bg:'bg-emerald-50  border-emerald-100'},
          {l:'Total Out',   v:`₹${totalOut.toFixed(2)}`, icon:TrendingDown, c:'text-rose-600',    bg:'bg-rose-50    border-rose-100'},
          {l:'Pending',     v:pending,                   icon:Clock,         c:'text-amber-600',   bg:'bg-amber-50   border-amber-100'},
        ].map(m=>(
          <div key={m.l} className={cn('rounded-2xl border p-5 flex flex-col gap-2', m.bg)}>
            <m.icon size={18} className={m.c}/>
            <p className={cn('text-2xl font-black', m.c)}>{m.v}</p>
            <p className="text-xs text-slate-500 font-medium">{m.l}</p>
          </div>
        ))}
      </div>

      {/* Withdraw modal */}
      {showWithdraw && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={()=>setShowWithdraw(false)}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-md animate-fade-in" onClick={e=>e.stopPropagation()}>
            <h2 className="text-lg font-black text-slate-900 mb-1">Request Withdrawal</h2>
            <p className="text-sm text-slate-500 mb-5">Min ₹{MIN} · Balance: ₹{balance.toFixed(2)}</p>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Amount (₹)</label>
                <input type="number" value={wForm.amount} onChange={e=>setWForm(p=>({...p,amount:e.target.value}))} placeholder={`Min ₹${MIN}`} min={MIN} max={balance} required className={inpCls}/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {METHODS.map(m=>(
                    <button key={m.id} type="button" onClick={()=>setWForm(p=>({...p,method:m.id}))}
                      className={cn('p-3 rounded-xl border-2 text-left transition-all', wForm.method===m.id?'border-indigo-400 bg-indigo-50':'border-slate-200 hover:border-slate-300')}>
                      <m.icon size={15} className={cn('mb-1', wForm.method===m.id?'text-indigo-600':'text-slate-400')}/>
                      <p className={cn('text-xs font-bold', wForm.method===m.id?'text-indigo-700':'text-slate-700')}>{m.label}</p>
                      <p className="text-[10px] text-slate-400">{m.hint}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Details</label>
                <input value={wForm.details} onChange={e=>setWForm(p=>({...p,details:e.target.value}))}
                  placeholder={wForm.method==='upi'?'yourname@upi':'Account number'} required className={inpCls}/>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={()=>setShowWithdraw(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-60">
                  {submitting?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"/>:'Request Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit modal */}
      {showDeposit && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={()=>setShowDeposit(false)}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-md animate-fade-in" onClick={e=>e.stopPropagation()}>
            <h2 className="text-lg font-black text-slate-900 mb-1">Add Funds</h2>
            <p className="text-sm text-slate-500 mb-5">Top up your advertiser wallet to run campaigns.</p>
            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Select Amount</label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[500,1000,2000,5000].map(v=>(
                    <button key={v} type="button" onClick={()=>setDForm({amount:v})}
                      className={cn('py-2.5 rounded-xl text-xs font-black border-2 transition-all', String(dForm.amount)===String(v)?'border-indigo-400 bg-indigo-50 text-indigo-700':'border-slate-200 text-slate-600 hover:border-slate-300')}>
                      ₹{v>=1000?`${v/1000}K`:v}
                    </button>
                  ))}
                </div>
                <input type="number" value={dForm.amount} onChange={e=>setDForm({amount:e.target.value})} placeholder="Custom amount (min ₹100)" min={100} required className={inpCls}/>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500">
                💡 Processed via Razorpay · UPI, Cards, Net Banking supported
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={()=>setShowDeposit(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-60">
                  {submitting?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"/>:`Pay ₹${dForm.amount||0}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction history */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History size={16} className="text-slate-400"/>
            <h2 className="font-bold text-slate-800">Transaction History</h2>
          </div>
          <div className="flex bg-slate-100 rounded-xl p-1">
            {['all','deposit','withdrawal','earning','spend'].map(f=>(
              <button key={f} onClick={()=>setTxFilter(f)}
                className={cn('px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all capitalize', txFilter===f?'bg-white text-indigo-600 shadow-sm':'text-slate-500 hover:text-slate-700')}>
                {f}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">{[1,2,3,4].map(i=><div key={i} className="skeleton h-12"/>)}</div>
        ) : filtered.length===0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400"><WalletIcon size={22}/></div>
            <p className="text-sm font-bold text-slate-700">No transactions yet</p>
            <p className="text-xs text-slate-400">{isPublisher?'Earnings appear here after ads run.':'Add funds to start campaigns.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>{['Transaction','Amount','Status','Date'].map(h=><th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((tx,i)=><TxRow key={tx._id||i} tx={tx}/>)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
