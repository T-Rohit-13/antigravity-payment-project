import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import VaultProgress from '../components/VaultProgress';
import WithdrawalModal from '../components/WithdrawalModal';

export default function Vault() {
  const { user, refreshUser } = useAuth();
  const [vault, setVault] = useState(null);
  const [activeTab, setActiveTab] = useState('goal');
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [message, setMessage] = useState(null);
  const pollRef = useRef(null);

  // Emergency form
  const [emergencyForm, setEmergencyForm] = useState({
    reason: 'job_loss',
    documentType: 'termination_letter',
    amount: '',
    file: null
  });
  const [submittingClaim, setSubmittingClaim] = useState(false);

  useEffect(() => {
    fetchVault();
    fetchClaimStatus();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const fetchVault = async () => {
    try {
      const res = await api.get('/vault');
      setVault(res.data);
    } catch (err) {
      console.error('Vault fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClaimStatus = async () => {
    try {
      const res = await api.get('/emergency/status');
      if (res.data.hasClaim) {
        setClaim(res.data.claim);
        // Start polling if claim is pending
        if (['submitted', 'ai_screening', 'human_review'].includes(res.data.claim.status)) {
          startPolling();
        }
      }
    } catch (err) {
      console.error('Claim status error:', err);
    }
  };

  const startPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get('/emergency/status');
        if (res.data.hasClaim) {
          setClaim(res.data.claim);
          if (['approved', 'rejected'].includes(res.data.claim.status)) {
            clearInterval(pollRef.current);
          }
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }, 30000);
  };

  const handleWithdraw = async (type) => {
    try {
      let res;
      if (type === 'early') {
        res = await api.post('/vault/withdraw');
      } else if (type === 'goal') {
        res = await api.post('/vault/withdraw/goal');
      } else if (type === 'partial') {
        res = await api.post('/vault/withdraw/partial');
      }
      setMessage({ type: 'success', text: res.data.message });
      setModal(null);
      await refreshUser();
      await fetchVault();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Withdrawal failed' });
    }
  };

  const handleEmergencySubmit = async (e) => {
    e.preventDefault();
    setSubmittingClaim(true);
    try {
      const formData = new FormData();
      formData.append('reason', emergencyForm.reason);
      formData.append('documentType', emergencyForm.documentType);
      formData.append('amount', emergencyForm.amount || vault?.balance || 0);
      if (emergencyForm.file) {
        formData.append('document', emergencyForm.file);
      }

      const res = await api.post('/emergency/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setClaim(res.data.claim);
      setMessage({ type: 'success', text: res.data.message });
      startPolling();
      await fetchVault();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Submission failed' });
    } finally {
      setSubmittingClaim(false);
    }
  };

  const statusSteps = ['submitted', 'ai_screening', 'human_review', 'approved'];
  const statusLabels = ['Submitted', 'AI Screening', 'Human Review', 'Approved'];

  const tabs = [
    { id: 'goal', label: '🏆 Goal Complete', shortLabel: 'Goal' },
    { id: 'emergency', label: '🆘 Emergency', shortLabel: 'Emergency' },
    { id: 'early', label: '⚠️ Early', shortLabel: 'Early' }
  ];

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Vault Status Banner */}
      <div className={`rounded-2xl p-5 mb-5 animate-fade-in ${
        vault?.status === 'locked' ? 'bg-gradient-to-r from-teal-500/10 to-teal-600/5 border border-teal-500/20' :
        vault?.status === 'unlock_ready' ? 'bg-gradient-to-r from-green-500/10 to-emerald-600/5 border border-green-500/20' :
        vault?.status === 'emergency_mode' ? 'bg-gradient-to-r from-red-500/10 to-red-600/5 border border-red-500/20' :
        'bg-gradient-to-r from-amber-500/10 to-yellow-600/5 border border-amber-500/20'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            {vault?.status === 'locked' && '🔒'}
            {vault?.status === 'unlock_ready' && '✅'}
            {vault?.status === 'emergency_mode' && '🆘'}
            {vault?.status === 'goal_complete' && '🏆'}
            Your Vault
          </h1>
          <span className="text-xs font-medium uppercase tracking-wide px-2 py-1 rounded-full glass-card text-gray-300">
            {vault?.status?.replace('_', ' ')}
          </span>
        </div>
        <p className="text-3xl font-bold text-white">
          ₹{parseFloat(vault?.balance || 0).toLocaleString('en-IN')}
        </p>
      </div>

      {/* Vault Progress */}
      <div className="mb-5 animate-slide-up">
        <VaultProgress
          current={vault?.balance || 0}
          goal={vault?.goalValue || user?.targetAmount || 100000}
          status={vault?.status || 'locked'}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 animate-slide-up animate-delay-100">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-medium transition-all duration-300 ${
              activeTab === tab.id ? 'tab-active' : 'tab-inactive glass-card'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      {message && (
        <div className={`p-3 rounded-xl mb-4 text-xs text-center font-medium animate-bounce-in ${
          message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' :
          'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tab Content */}
      <div className="animate-slide-up animate-delay-200">
        {/* Goal Complete Tab */}
        {activeTab === 'goal' && (
          <div className="glass-card p-5 rounded-3xl space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
            <h3 className="text-base font-bold text-white mb-1">Goal-Complete Status</h3>
            <div className="p-3 rounded-xl bg-navy-900 border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-1">Your Vault Target</p>
                <p className="text-sm text-teal-400 font-bold">
                  {user?.goalType === 'age' ? `Age ${user?.retirementAge} (Currently ${user?.age})` : `₹${parseFloat(user?.targetAmount || 0).toLocaleString('en-IN')}`}
                </p>
              </div>
              <div className={`text-2xl ${vault?.status === 'unlock_ready' || vault?.status === 'goal_complete' ? 'text-green-400' : 'text-gray-600'}`}>
                {vault?.status === 'unlock_ready' || vault?.status === 'goal_complete' ? '🎯' : '🔒'}
              </div>
            </div>
            <p className="text-[11px] text-gray-400">Complete your goal to permanently unlock penalty-free withdrawal and earn maximum bonus rewards.</p>

            {/* Timeline */}
            <div className="space-y-3">
              {['Goal Met', '7-Day Window', 'KYC Verified', 'Transfer', 'Badge Earned'].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    vault?.status === 'goal_complete' || (vault?.status === 'unlock_ready' && i < 2)
                      ? 'gradient-teal text-navy-900'
                      : 'bg-white/[0.06] text-gray-600'
                  }`}>
                    {(vault?.status === 'goal_complete' || (vault?.status === 'unlock_ready' && i < 2)) ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs ${
                    vault?.status === 'goal_complete' || (vault?.status === 'unlock_ready' && i < 2)
                      ? 'text-white' : 'text-gray-500'
                  }`}>{step}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setModal('goal')}
              disabled={vault?.status !== 'unlock_ready'}
              className="w-full btn-primary text-sm py-3"
            >
              {vault?.status === 'unlock_ready' ? '🏆 Claim Withdrawal' : '🔒 Goal Not Reached Yet'}
            </button>
          </div>
        )}

        {/* Emergency Tab */}
        {activeTab === 'emergency' && (
          <div className="space-y-4">
            <div className="glass-card p-5 rounded-2xl">
              <h3 className="text-sm font-semibold text-white mb-1">Emergency Withdrawal</h3>
              <p className="text-xs text-gray-400 mb-4">
                Submit proof for review. Max {2 - (user?.emergencyWithdrawalsUsed || 0)} emergency withdrawals remaining.
              </p>

              {claim && ['submitted', 'ai_screening', 'human_review', 'approved', 'rejected'].includes(claim.status) ? (
                /* Status Tracker */
                <div>
                  <h4 className="text-xs font-medium text-gray-300 mb-3">Claim Status</h4>
                  <div className="flex items-center gap-1 mb-4">
                    {statusSteps.map((step, i) => {
                      const stepIndex = statusSteps.indexOf(claim.status);
                      const isActive = i <= stepIndex;
                      const isCurrent = step === claim.status;
                      return (
                        <div key={step} className="flex-1 flex flex-col items-center">
                          <div className={`w-full h-2 rounded-full mb-1 ${
                            isActive ? 'gradient-teal' : 'bg-white/[0.08]'
                          } ${isCurrent ? 'animate-pulse-slow' : ''}`} />
                          <span className={`text-[9px] ${isActive ? 'text-teal-400' : 'text-gray-600'}`}>
                            {statusLabels[i]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {claim.status === 'rejected' && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                      <p className="text-xs text-red-400">Claim rejected: {claim.reviewNote || 'No reason provided'}</p>
                    </div>
                  )}
                  {claim.status === 'approved' && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                      <p className="text-xs text-green-400">✅ Claim approved! Funds will be transferred shortly.</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Emergency Form */
                <form onSubmit={handleEmergencySubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Reason</label>
                    <select
                      value={emergencyForm.reason}
                      onChange={(e) => setEmergencyForm(prev => ({ ...prev, reason: e.target.value }))}
                      className="input-field"
                    >
                      <option value="job_loss">Job Loss</option>
                      <option value="medical">Medical Emergency</option>
                      <option value="legal">Legal</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Document Type</label>
                    <select
                      value={emergencyForm.documentType}
                      onChange={(e) => setEmergencyForm(prev => ({ ...prev, documentType: e.target.value }))}
                      className="input-field"
                    >
                      <option value="termination_letter">Termination Letter</option>
                      <option value="medical_cert">Medical Certificate</option>
                      <option value="epfo">EPFO Document</option>
                      <option value="salary_slip">Salary Slip</option>
                      <option value="legal_notice">Legal Notice</option>
                      <option value="esic">ESIC Document</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs text-gray-400 font-medium">Upload Proof (PDF/JPG)</label>
                      <button type="button" onClick={() => {
                        const file = new File(["dummy buffer"], "demo_termination_letter.pdf", { type: "application/pdf" });
                        setEmergencyForm(prev => ({ ...prev, file, documentType: 'termination_letter' }));
                      }} className="text-[10px] text-teal-400 font-bold px-2 py-1 bg-teal-500/10 rounded-md border border-teal-500/20 hover:bg-teal-500/20 transition-all">Demo Upload 🪄</button>
                    </div>
                    {emergencyForm.file ? (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                        <span className="text-xs text-green-400 font-medium overflow-hidden whitespace-nowrap text-ellipsis">{emergencyForm.file.name}</span>
                        <button type="button" onClick={() => setEmergencyForm(prev => ({ ...prev, file: null }))} className="text-xs text-gray-500 hover:text-white px-2">✕</button>
                      </div>
                    ) : (
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setEmergencyForm(prev => ({ ...prev, file: e.target.files[0] }))}
                        className="w-full text-xs text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-medium file:bg-white/[0.06] file:text-gray-300 hover:file:bg-white/[0.1]"
                      />
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submittingClaim || (user?.emergencyWithdrawalsUsed || 0) >= 2}
                    className="w-full btn-danger text-sm py-3"
                  >
                    {submittingClaim ? 'Submitting...' : '🆘 Submit Emergency Claim'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Early Withdrawal Tab */}
        {activeTab === 'early' && (
          <div className="glass-card p-5 rounded-2xl space-y-4">
            <h3 className="text-sm font-semibold text-white">Early Withdrawal</h3>

            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <span className="text-lg">⚠️</span>
                <div>
                  <p className="text-xs font-medium text-red-400 mb-1">Warning: Penalties Apply</p>
                  <ul className="text-[11px] text-red-300/80 space-y-1">
                    <li>• Your streak will be reset to 0</li>
                    <li>• XP will be reduced by 50%</li>
                    <li>• You may lose badge progress</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Partial Toggle */}
            <div className="flex items-center justify-between p-3 glass-card rounded-xl">
              <div>
                <p className="text-xs font-medium text-white">Partial Withdrawal</p>
                <p className="text-[10px] text-gray-400">Take only 50%, keep rest growing</p>
              </div>
              <button
                onClick={() => setModal('partial')}
                disabled={vault?.partialWithdrawalUsed || !vault?.balance || parseFloat(vault.balance) <= 0}
                className="text-xs px-3 py-1.5 rounded-lg bg-accent-amber/20 text-accent-amber font-medium hover:bg-accent-amber/30 transition-all disabled:opacity-40"
              >
                {vault?.partialWithdrawalUsed ? 'Used' : 'Take 50%'}
              </button>
            </div>

            <button
              onClick={() => setModal('early')}
              disabled={!vault?.balance || parseFloat(vault.balance) <= 0}
              className="w-full btn-danger text-sm py-3"
            >
              💸 Withdraw All (With Penalty)
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <WithdrawalModal
          type={modal}
          balance={vault?.balance || 0}
          onConfirm={() => handleWithdraw(modal)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
