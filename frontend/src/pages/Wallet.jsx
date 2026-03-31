import { useState, useEffect } from 'react';
import api from '../api/axios';
import StatsCard from '../components/StatsCard';
import { Wallet, TrendingUp, History, PlusCircle, CreditCard, ChevronRight, Landmark, ArrowDownCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function WalletPage() {
  const { activeRole } = useAuth();
  const [user, setUser] = useState(null);
  const [amount, setAmount] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [razorpayKeyId, setRazorpayKeyId] = useState('');

  // Withdrawal state
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

  if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1><Wallet size={28} /> My Wallet</h1>
          <p className="page-subtitle">Add credits and track your spends in ₹ INR</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatsCard icon={<Wallet size={24} />} label="Available Balance" value={`₹${user?.walletBalance.toFixed(2)}`} color="green" />
        <StatsCard icon={<TrendingUp size={24} />} label="Total Spent" value={`₹${transactions.filter(t => t.type === 'spend' || t.type === 'payout').reduce((a, b) => a + b.amount, 0).toFixed(2)}`} color="blue" />
        <StatsCard icon={<History size={24} />} label="Total Deposits" value={`₹${transactions.filter(t => t.type === 'deposit' && t.status === 'completed').reduce((a, b) => a + b.amount, 0).toFixed(2)}`} color="purple" />
      </div>

      <div className="dashboard-grid">
        {activeRole === 'advertiser' ? (
          <div className="card">
            <div className="card-header"><h2><PlusCircle size={18}/> Recharge Credits</h2></div>
            <div className="card-body">
              <p className="text-muted mb-4">Minimum deposit is <strong>₹100</strong>. Credits are added instantly after payment.</p>
              <form onSubmit={handleDeposit} className="auth-form full-width">
                <div className="form-group">
                  <label>Amount to Add (₹ INR)</label>
                  <div className="input-with-icon">
                    <span className="icon">₹</span>
                    <input
                      type="number"
                      min="100"
                      placeholder="100"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      className="input--dark pl-12"
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn--primary btn--full">
                  <CreditCard size={18} /> Proceed to Pay
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-header"><h2><ArrowDownCircle size={18}/> Withdraw Funds</h2></div>
            <div className="card-body">
              <p className="text-muted mb-4">Request a payout of your ad earnings. Minimum withdrawal is <strong>₹500</strong>.</p>
              <form onSubmit={handleWithdraw} className="auth-form full-width">
                <div className="form-group">
                  <label>Amount (₹ INR)</label>
                  <input
                    type="number"
                    min="500"
                    placeholder="500"
                    value={withdrawData.amount}
                    onChange={(e) => setWithdrawData({ ...withdrawData, amount: e.target.value })}
                    required
                    className="input--dark"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Method</label>
                    <select
                      value={withdrawData.method}
                      onChange={(e) => setWithdrawData({ ...withdrawData, method: e.target.value })}
                      className="input--dark"
                    >
                      <option value="UPI">UPI (GooglePay/PhonePe)</option>
                      <option value="Bank">Bank Transfer</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Payout Details (UPI ID or Bank A/C info)</label>
                  <textarea
                    placeholder="e.g. user@okaxis"
                    value={withdrawData.details}
                    onChange={(e) => setWithdrawData({ ...withdrawData, details: e.target.value })}
                    required
                    className="input--dark"
                    rows={2}
                  />
                </div>
                <button type="submit" className="btn btn--primary btn--full">
                  <Landmark size={18} /> Request Withdrawal
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="card card--full">
          <div className="card-header"><h2><History size={18}/> Recent Transactions</h2></div>
          <div className="card-body">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Reference</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 10).map((tx) => (
                    <tr key={tx._id}>
                      <td><span className={`badge badge--${tx.type}`}>{tx.type}</span></td>
                      <td className="text-small">{tx.reference || 'Network Wallet'}</td>
                      <td className={tx.type === 'deposit' ? 'text-green' : 'text-red'}>
                        {tx.type === 'deposit' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                      </td>
                      <td><span className={`badge badge--${tx.status}`}>{tx.status}</span></td>
                      <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-muted">No transactions yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
