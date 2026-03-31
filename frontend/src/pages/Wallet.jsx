import { useState, useEffect } from 'react';
import api from '../api/axios';
import StatsCard from '../components/StatsCard';
import { Wallet, TrendingUp, History, PlusCircle, CreditCard, ChevronRight, Landmark, ArrowDownCircle, DollarSign, Activity, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function WalletPage() {
  const { activeRole } = useAuth();
  const [user, setUser] = useState(null);
  const [amount, setAmount] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [withdrawData, setWithdrawData] = useState({ amount: '', method: 'UPI', details: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userRes, txRes, configRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/payments/transactions'),
        api.get('/auth/config')
      ]);
      setUser(userRes.data);
      setTransactions(txRes.data || []);
      setRazorpayKeyId(configRes.data.razorpayKeyId);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (amount < 100) return alert('Minimum deposit ₹100');

    try {
      const res = await loadRazorpay();
      if (!res) return alert('Razorpay SDK failed to load');

      const { data: order } = await api.post('/payments/create-order', { amount: parseInt(amount) });

      const options = {
        key: razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: 'TeleAds Platform',
        description: 'Wallet Deposit',
        order_id: order.id,
        handler: async (response) => {
          try {
            await api.post('/payments/verify', response);
            alert('Payment successful!');
            fetchData();
            setAmount('');
          } catch (err) {
            alert('Verification failed');
          }
        },
        prefill: {
          email: user?.email,
        },
        theme: {
          color: '#6366f1',
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing payment');
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payments/withdraw', withdrawData);
      alert('Withdrawal request submitted! Superadmin will approve it soon.');
      setWithdrawData({ amount: '', method: 'UPI', details: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Withdrawal failed');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-10 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-emerald-500/20 shadow-xl">
                 <Wallet size={28} />
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Financial Center</h1>
           </div>
           <p className="text-slate-500 text-lg font-medium">Manage your platform liquidity and earnings</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard icon={<Wallet size={24} />} label="Wallet Balance" value={`₹${user?.walletBalance?.toFixed(2)}`} color="emerald" />
        <StatsCard icon={<TrendingUp size={24} />} label="Total Activity" value={`₹${transactions.filter(t => t.type === 'spend' || t.type === 'payout').reduce((a, b) => a + b.amount, 0).toFixed(2)}`} color="indigo" />
        <StatsCard icon={<History size={24} />} label="Global Deposits" value={`₹${transactions.filter(t => t.type === 'deposit' && t.status === 'completed').reduce((a, b) => a + b.amount, 0).toFixed(2)}`} color="purple" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <div className="xl:col-span-4">
          {activeRole === 'advertiser' ? (
            <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 text-slate-50 opacity-20 -rotate-12 group-hover:rotate-0 transition-transform duration-700">
                 <PlusCircle size={100} />
              </div>
              <div className="relative z-10 space-y-6">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                  <CreditCard className="text-indigo-600" />
                  Recharge Credits
                </h2>
                <p className="text-slate-500 font-medium leading-relaxed">Fuel your ad campaigns with instant deposits via Razorpay Secure.</p>
                <form onSubmit={handleDeposit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Amount to Inject (₹)</label>
                    <div className="relative group/input">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400 group-focus-within/input:text-indigo-600 transition-colors">₹</span>
                      <input
                        type="number"
                        min="100"
                        placeholder="100"
                        value={amount}
                        className="pro-input pl-12"
                        onChange={(e) => setAmount(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" className="pro-btn-primary w-full py-5 text-sm uppercase tracking-widest">
                    <span>Authorize Recharge</span>
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 text-slate-50 opacity-20 -rotate-12 group-hover:rotate-0 transition-transform duration-700">
                 <Landmark size={100} />
              </div>
              <div className="relative z-10 space-y-6">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                  <ArrowDownCircle className="text-emerald-600" />
                  Request Payout
                </h2>
                <p className="text-slate-500 font-medium leading-relaxed">Withdraw your ad earnings to your preferred payment method.</p>
                <form onSubmit={handleWithdraw} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Withdraw Amount (₹)</label>
                    <input
                      type="number"
                      min="500"
                      placeholder="500"
                      className="pro-input"
                      value={withdrawData.amount}
                      onChange={(e) => setWithdrawData({ ...withdrawData, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Channel</label>
                    <select
                      value={withdrawData.method}
                      onChange={(e) => setWithdrawData({ ...withdrawData, method: e.target.value })}
                      className="pro-input cursor-pointer"
                    >
                      <option value="UPI">UPI Protocol (Instant)</option>
                      <option value="Bank">Bank Wire (NEFT/RTGS)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Destination Address</label>
                    <textarea
                      placeholder="e.g. VPA ID or Account + IFSC"
                      value={withdrawData.details}
                      onChange={(e) => setWithdrawData({ ...withdrawData, details: e.target.value })}
                      required
                      className="pro-input resize-none"
                      rows={2}
                    />
                  </div>
                  <button type="submit" className="pro-btn-primary w-full py-5 text-sm uppercase tracking-widest">
                    <span>Initiate Payout</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        <div className="xl:col-span-8">
           <section className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-200">
              <div className="flex items-center justify-between p-8 border-b border-slate-50 bg-slate-50/30">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                       <FileText size={18} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Financial Ledger</h2>
                 </div>
                 <div className="px-4 py-1.5 bg-white border border-slate-100 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest">
                    Trace History
                 </div>
              </div>
              
              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                          <th className="px-8 py-5">Type</th>
                          <th className="px-8 py-5">Reference</th>
                          <th className="px-8 py-5">Delta</th>
                          <th className="px-8 py-5">Status</th>
                          <th className="px-8 py-5">Node Date</th>
                       </tr>
                    </thead>
                    <tbody>
                       {transactions.slice(0, 10).map((tx) => (
                          <tr key={tx._id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors group">
                             <td className="px-8 py-6">
                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                  tx.type === 'deposit' || tx.type === 'earning' ? 'bg-emerald-50 text-emerald-600' : 
                                  'bg-rose-50 text-rose-600'
                                }`}>{tx.type}</span>
                             </td>
                             <td className="px-8 py-6 font-bold text-slate-500 text-xs truncate max-w-[150px]">{tx.reference || 'Network Ops'}</td>
                             <td className="px-8 py-6">
                                <div className={`flex items-center gap-1.5 font-black text-lg ${tx.type === 'deposit' || tx.type === 'earning' ? 'text-emerald-600' : 'text-rose-500'}`}>
                                   <span>{tx.type === 'deposit' || tx.type === 'earning' ? '+' : '-'}</span>
                                   <span>₹{tx.amount.toFixed(2)}</span>
                                </div>
                             </td>
                             <td className="px-8 py-6">
                                <div className="flex items-center gap-2">
                                   <div className={`w-1.5 h-1.5 rounded-full ${tx.status === 'completed' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : tx.status === 'pending' ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{tx.status}</span>
                                </div>
                             </td>
                             <td className="px-8 py-6 font-bold text-slate-400 text-xs uppercase">{new Date(tx.createdAt).toLocaleDateString()}</td>
                          </tr>
                       ))}
                       {transactions.length === 0 && (
                          <tr><td colSpan="5" className="text-center py-20 text-slate-300 font-bold italic tracking-widest uppercase">No ledger entries detected</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </section>
        </div>
      </div>
    </div>
  );
}
