import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Onboarding() {
  const [mode, setMode] = useState('register'); // register or login
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    pin: '',
    age: 22,
    goalType: 'amount',
    retirementAge: 55,
    targetAmount: 5000000
  });

  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState('');

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  // Simulate OTP delivery
  const handleRequestOTP = () => {
    if (form.phone.length !== 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setOtpMode(true);
    // Auto-fill OTP for demo purposes after 1.5s
    setTimeout(() => {
      setOtp('1234');
    }, 1500);
  };

  const handleVerifyOTP = () => {
    if (otp !== '1234') {
      setError('Invalid OTP');
      return;
    }
    setOtpMode(false);
    if (mode === 'login') {
      // For login, directly go to PIN
      setStep(2);
    } else {
      // For signup, if name is missing
      if (!form.name) {
        setError('Please enter your name too');
        setOtpMode(true);
      } else {
        setStep(2);
      }
    }
  };

  const handlePinSubmit = () => {
    if (form.pin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }
    if (mode === 'login') {
      executeAuth();
    } else {
      setStep(3); // Go to goal selection for signup
    }
  };

  const executeAuth = async () => {
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        await login(form.phone, form.pin);
      } else {
        await register(form);
      }
      navigate('/dashboard');
    } catch (err) {
      if (!err.response) {
         setError('Network Error: Is the backend server running?');
      } else {
         setError(err.response?.data?.error || 'Authentication failed. Please check your PIN.');
      }
      setForm(prev => ({ ...prev, pin: '' }));
      if (mode === 'login') setStep(2);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 relative overflow-hidden flex flex-col justify-between">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-purple/10 rounded-full blur-[100px] pointer-events-none translate-y-1/2 -translate-x-1/2" />

      <div className="relative flex-1 flex flex-col pt-12 px-6">
        
        {/* Header */}
        <div className="mb-8 animate-fade-in text-center">
          <div className="w-16 h-16 bg-white flex items-center justify-center rounded-2xl shadow-xl mx-auto mb-4 rotate-3">
            <span className="text-3xl block -rotate-3">🏰</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">RetireQuest</h1>
          <p className="text-sm text-teal-400 font-medium mt-1">
            Build your future, UPI fast.
          </p>
        </div>

        {/* Step 1: Mobile & Auth Layer */}
        {step === 1 && (
          <div className="w-full max-w-sm mx-auto space-y-6 animate-slide-up bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-xl">
            
            <div className="flex bg-navy-900/50 p-1 rounded-xl mb-6">
              <button 
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'register' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500'}`}
                onClick={() => { setMode('register'); setError(''); setOtpMode(false); }}
              >
                Sign Up
              </button>
              <button 
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'login' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500'}`}
                onClick={() => { setMode('login'); setError(''); setOtpMode(false); }}
              >
                Login
              </button>
            </div>

            {!otpMode ? (
              <div className="space-y-4">
                {mode === 'register' && (
                  <div>
                    <label className="text-xs text-gray-400 font-medium ml-1 mb-1 block">Full Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => updateForm('name', e.target.value)}
                      className="w-full bg-navy-900 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm"
                      placeholder="e.g. Rahul Sharma"
                    />
                  </div>
                )}
                
                <div>
                  <label className="text-xs text-gray-400 font-medium ml-1 mb-1 block">Mobile Number</label>
                  <div className="flex bg-navy-900 border border-white/10 rounded-xl overflow-hidden focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 transition-all">
                    <div className="px-4 py-3.5 bg-white/5 border-r border-white/10 text-gray-400 text-sm font-medium flex items-center">
                      +91
                    </div>
                    <input
                      type="tel"
                      maxLength="10"
                      value={form.phone}
                      onChange={(e) => updateForm('phone', e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-transparent px-4 py-3.5 text-white focus:outline-none text-sm font-medium tracking-wider"
                      placeholder="99999 99999"
                    />
                  </div>
                </div>

                <button
                  onClick={handleRequestOTP}
                  className="w-full py-3.5 bg-white text-navy-900 font-bold rounded-xl shadow-[0_4px_20px_rgba(255,255,255,0.2)] hover:scale-[1.02] transition-transform"
                >
                  Proceed securely →
                </button>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in text-center">
                <p className="text-sm text-gray-300">
                  Enter the 4-digit OTP sent to <br/><span className="text-teal-400 font-semibold tracking-wider">+91 {form.phone}</span>
                </p>
                <input
                  type="text"
                  maxLength="4"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-32 bg-navy-900 border border-teal-500/50 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-[0.5em] focus:outline-none shadow-[0_0_15px_rgba(20,184,166,0.3)] mx-auto block"
                  placeholder="••••"
                />
                <p className="text-[10px] text-gray-500">Auto-reading OTP for demo...</p>
                
                <button
                  onClick={handleVerifyOTP}
                  className="w-full py-3.5 bg-teal-500 text-navy-900 font-bold rounded-xl hover:bg-teal-400 transition-colors shadow-[0_4px_20px_rgba(20,184,166,0.3)]"
                >
                  Verify
                </button>
              </div>
            )}
            
            {error && <p className="text-xs text-red-400 text-center animate-bounce">{error}</p>}
          </div>
        )}

        {/* Step 2: Set/Enter PIN */}
        {step === 2 && (
          <div className="w-full max-w-sm mx-auto animate-slide-up flex flex-col items-center mt-10">
            <h2 className="text-2xl font-bold text-white mb-2">
              {mode === 'register' ? 'Set 4-Digit PIN' : 'Enter PIN'}
            </h2>
            <p className="text-sm text-gray-400 mb-8 text-center">
              {mode === 'register' ? 'Keep your vault secure' : 'Unlock your secure vault'}
            </p>

            {/* PIN Dots Display */}
            <div className="flex gap-4 mb-12">
              {[0, 1, 2, 3].map(i => (
                <div 
                  key={i} 
                  className={`w-4 h-4 rounded-full transition-all duration-300 ${
                    form.pin.length > i 
                      ? 'bg-teal-400 scale-125 shadow-[0_0_10px_rgba(45,212,191,0.5)]' 
                      : 'bg-white/10'
                  }`}
                />
              ))}
            </div>

            {/* Simulated Numpad */}
            <div className="grid grid-cols-3 gap-x-6 gap-y-6 mb-8 w-64 mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  onClick={() => form.pin.length < 4 && updateForm('pin', form.pin + num)}
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-light text-white bg-white/5 active:bg-white/20 transition-colors mx-auto"
                >
                  {num}
                </button>
              ))}
              <div />
              <button
                onClick={() => form.pin.length < 4 && updateForm('pin', form.pin + '0')}
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-light text-white bg-white/5 active:bg-white/20 transition-colors mx-auto"
              >
                0
              </button>
              <button
                onClick={() => updateForm('pin', form.pin.slice(0, -1))}
                className="w-16 h-16 rounded-full flex items-center justify-center text-xl text-gray-400 active:bg-white/20 transition-colors mx-auto"
              >
                ⌫
              </button>
            </div>

            <button
              onClick={handlePinSubmit}
              disabled={form.pin.length !== 4 || loading}
              className="w-full max-w-xs py-3.5 bg-teal-500 disabled:opacity-50 text-navy-900 font-bold rounded-xl transition-colors shadow-[0_4px_20px_rgba(20,184,166,0.3)]"
            >
              {loading ? 'Authenticating...' : mode === 'login' ? 'Unlock Account' : 'Set PIN Details'}
            </button>
            {error && <p className="text-xs text-red-400 text-center mt-3 animate-bounce">{error}</p>}
          </div>
        )}

        {/* Step 3: Goals (Register Only) */}
        {step === 3 && (
          <div className="w-full max-w-sm mx-auto animate-slide-up pb-10">
            <h2 className="text-2xl font-bold text-white mb-2">Set Your Target</h2>
            <p className="text-sm text-gray-400 mb-6">Every quest needs a destination.</p>

            <div className="glass-card p-5 rounded-3xl space-y-6">
              {/* Type Toggle */}
              <div className="flex bg-navy-900/50 p-1 rounded-xl">
                <button 
                  className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all flex flex-col items-center gap-1 ${form.goalType === 'amount' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500'}`}
                  onClick={() => updateForm('goalType', 'amount')}
                >
                  <span className="text-lg">💰</span>
                  Corpus Amount
                </button>
                <button 
                  className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all flex flex-col items-center gap-1 ${form.goalType === 'age' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500'}`}
                  onClick={() => updateForm('goalType', 'age')}
                >
                  <span className="text-lg">🎯</span>
                  Retirement Age
                </button>
              </div>

              {/* Slider Config */}
              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label className="text-xs text-gray-400 font-medium">Your Current Age</label>
                    <span className="text-lg text-white font-bold">{form.age} yrs</span>
                  </div>
                  <input type="range" min="18" max="40" value={form.age} onChange={(e) => updateForm('age', parseInt(e.target.value))} className="w-full h-2 bg-white/10 rounded-full appearance-none accent-teal-500" />
                </div>

                {form.goalType === 'amount' ? (
                  <div className="pt-2 border-t border-white/5">
                    <div className="flex justify-between items-end mb-2">
                      <label className="text-xs text-gray-400 font-medium">Target Amount</label>
                      <span className="text-2xl text-teal-400 font-bold tracking-tight">
                        ₹{(form.targetAmount >= 10000000) ? `${(form.targetAmount/10000000).toFixed(1)} Cr` : `${(form.targetAmount/100000).toFixed(1)} L`}
                      </span>
                    </div>
                    <input type="range" min="500000" max="50000000" step="500000" value={form.targetAmount} onChange={(e) => updateForm('targetAmount', parseInt(e.target.value))} className="w-full h-2 bg-white/10 rounded-full appearance-none accent-teal-500 mt-2" />
                  </div>
                ) : (
                  <div className="pt-2 border-t border-white/5">
                    <div className="flex justify-between items-end mb-2">
                      <label className="text-xs text-gray-400 font-medium">Retire At Age</label>
                      <span className="text-2xl text-teal-400 font-bold tracking-tight">{form.retirementAge} yrs</span>
                    </div>
                    <input type="range" min="40" max="70" value={form.retirementAge} onChange={(e) => updateForm('retirementAge', parseInt(e.target.value))} className="w-full h-2 bg-white/10 rounded-full appearance-none accent-teal-500 mt-2" />
                  </div>
                )}
              </div>

              <button
                onClick={executeAuth}
                disabled={loading}
                className="w-full py-4 bg-teal-500 text-navy-900 font-bold rounded-xl shadow-[0_4px_20px_rgba(20,184,166,0.3)] hover:scale-[1.02] transition-transform flex justify-center items-center mt-2"
              >
                {loading ? 'Creating Vault...' : '🚀 Start Your Quest Now'}
              </button>
              {error && <p className="text-xs text-red-400 text-center animate-bounce">{error}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
