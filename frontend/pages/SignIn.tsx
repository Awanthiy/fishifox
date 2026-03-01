
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck, Activity, Terminal } from 'lucide-react';
import { db } from '../db';

const SignIn: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate "establishing secure link" for premium feel
    setTimeout(async () => {
      // Await the asynchronous login call to check actual credentials
      const success = await db.login(username, password);
      if (success) {
        // Trigger a custom event so App.tsx knows to re-render immediately
        window.dispatchEvent(new Event('auth-change'));
        navigate('/'); 
      } else {
        setError('The credentials provided do not match our records.');
        setIsLoading(false);
      }
    }, 1000); 
  };

  return (
    <div className="min-h-screen w-full bg-[#4B49AC] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/5 rounded-full -mr-96 -mt-96 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/5 rounded-full -ml-48 -mb-48 blur-3xl"></div>

      <div className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[3.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.3)] overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-700">
        
        {/* Left Side: Branding & Info */}
        <div className="bg-primary p-16 lg:p-24 flex flex-col justify-between relative overflow-hidden hidden lg:flex">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,0.1),transparent)]"></div>
          
          <div className="relative z-10">
            <div className="space-y-2 mb-20">
              <h1 className="text-6xl font-logo font-black tracking-tight leading-none text-white">
                Fishi<span className="text-secondary">Fox</span>
              </h1>
              <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] leading-tight">
                DIVING TO AN UNEXPECTED DEPTH
              </p>
            </div>

            <div className="space-y-10">
              <h2 className="text-4xl font-black text-white leading-tight">
                Enterprise <br/>
                <span className="text-secondary">Operations Portal</span>
              </h2>
              <p className="text-white/60 text-lg font-medium leading-relaxed max-w-sm">
                Access your centralized management cabinet for real-time service tracking and client automation.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-6">
            <div className="flex -space-x-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-primary bg-white/10 backdrop-blur-md flex items-center justify-center text-[10px] font-bold text-white">
                  FX
                </div>
              ))}
            </div>
            <p className="text-xs font-bold text-white/50 uppercase tracking-widest">Trusted by 40+ Entities</p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-12 lg:p-24 flex flex-col justify-center relative">
          <div className="mb-12">
            <div className="lg:hidden mb-10">
               <h1 className="text-4xl font-logo font-black tracking-tight text-primary">
                Fishi<span className="text-secondary">Fox</span>
              </h1>
            </div>
            <h3 className="text-3xl font-black text-[#2F2F2F] tracking-tight">Identity Authentication</h3>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-2">Enter credentials to proceed</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-500 text-xs font-bold animate-in slide-in-from-top-2">
                <ShieldCheck size={16} />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Identifier</label>
              <div className="relative flex items-center bg-slate-50 border border-[#F1F3FF] rounded-2xl px-6 py-5 w-full focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10 transition-all group">
                <User size={18} className="text-slate-400 mr-4 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  className="bg-transparent border-none outline-none text-sm w-full font-bold text-slate-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secret Phrase</label>
              </div>
              <div className="relative flex items-center bg-slate-50 border border-[#F1F3FF] rounded-2xl px-6 py-5 w-full focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10 transition-all group">
                <Lock size={18} className="text-slate-400 mr-4 group-focus-within:text-primary transition-colors" />
                <input 
                  type={showPass ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-transparent border-none outline-none text-sm w-full font-bold text-slate-700"
                />
                <button 
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="text-slate-300 hover:text-slate-600 transition-colors"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white py-6 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:bg-primary/90 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:translate-y-0 mt-8"
            >
              {isLoading ? (
                <Activity size={20} className="animate-spin" />
              ) : (
                <>
                  Establish Connection
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials Badge */}
          <div className="mt-12 p-6 bg-slate-50 rounded-[2rem] border border-[#F1F3FF] relative group overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform">
                <Terminal size={40} />
             </div>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Development Preview</p>
             <div className="flex flex-col gap-1">
                <p className="text-xs font-bold text-slate-600">Username: <span className="text-primary">admin</span></p>
                <p className="text-xs font-bold text-slate-600">Password: <span className="text-primary">admin123</span></p>
             </div>
          </div>

          <p className="mt-8 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">
            Fishifox Management Systems v2.0.4
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
