
import React, { useState } from 'react';
import { 
  FileText, 
  ShieldCheck, 
  Paperclip, 
  Layout, 
  CheckSquare, 
  Plus, 
  Download, 
  Eye, 
  Trash2,
  Lock,
  Unlock,
  ExternalLink,
  ChevronRight,
  Terminal,
  Cpu
} from 'lucide-react';

const ProjectDetails: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showPass, setShowPass] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-200 text-white">
            <Cpu size={40} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border border-emerald-100">Active</span>
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">ID: #FF-8821-X</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">SoftVibe <span className="text-blue-600">Site Redesign</span></h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex -space-x-2">
                 {[1,2,3].map(i => (
                   <div key={i} className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">JD</div>
                 ))}
              </div>
              <span className="text-sm font-semibold text-slate-500">3 Members Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-4 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-red-500 hover:border-red-200 transition-all shadow-sm">
            <Trash2 size={22} />
          </button>
          <button className="px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] font-bold text-sm shadow-xl shadow-slate-200 hover:-translate-y-0.5 transition-all">
            Update Status
          </button>
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="flex items-center gap-4 bg-slate-100/50 p-1.5 rounded-[2rem] border border-slate-200/50 w-fit">
        {[
          { id: 'overview', label: 'Summary', icon: <Layout size={18} /> },
          { id: 'tasks', label: 'Workforce', icon: <CheckSquare size={18} /> },
          { id: 'documents', label: 'Archives', icon: <Paperclip size={18} /> },
          { id: 'vault', label: 'Secure Vault', icon: <ShieldCheck size={18} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-[1.5rem] text-sm font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-blue-600 shadow-md ring-1 ring-slate-200/50' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pt-4">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <div className="bg-white p-10 rounded-[3rem] border border-slate-200/50 shadow-sm relative overflow-hidden group">
                <div className="absolute right-0 bottom-0 opacity-5 -mb-10 -mr-10 group-hover:scale-110 transition-transform duration-1000">
                  <Terminal size={300} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                  <Terminal size={24} className="text-blue-600" />
                  Project Scope
                </h3>
                <div className="space-y-6 text-slate-600 leading-relaxed font-medium">
                  <p className="text-lg">Deploying a high-performance headless architecture using React, Next.js, and a Laravel API backend. Focus is on 99+ Core Web Vitals scores.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                    {[
                      'Complete UI/UX Audit',
                      'Database Schema Migration',
                      'AWS Infrastructure Setup',
                      'Global CDN Integration',
                      'Automated CI/CD Pipelines'
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          <ChevronRight size={14} />
                        </div>
                        <span className="text-sm font-bold text-slate-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-8">
               <div className="bg-white p-8 rounded-[3rem] border border-slate-200/50 shadow-sm">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Timeline Integrity</h4>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                         <span className="text-[10px] font-bold text-slate-400 uppercase">Started</span>
                         <span className="text-sm font-black text-slate-900">Jan 12, 2024</span>
                      </div>
                      <div className="flex flex-col text-right">
                         <span className="text-[10px] font-bold text-slate-400 uppercase">Deadline</span>
                         <span className="text-sm font-black text-rose-500">Mar 30, 2024</span>
                      </div>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full relative overflow-hidden">
                       <div className="absolute top-0 left-0 h-full bg-blue-600 rounded-full w-2/3 shadow-[0_0_15px_rgba(37,99,235,0.4)]"></div>
                    </div>
                    <p className="text-center text-[11px] font-bold text-slate-500">PROJECT IS 66% COMPLETE</p>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'vault' && (
          <div className="max-w-4xl mx-auto py-4">
            <div className="bg-[#0F172A] text-white p-12 rounded-[4rem] shadow-2xl relative border border-slate-800 group overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.1),transparent)] pointer-events-none"></div>
              
              <div className="flex items-center justify-between mb-12 relative z-10">
                <div className="flex items-center gap-5">
                  <div className={`p-5 rounded-[2rem] transition-all duration-500 ${showPass ? 'bg-blue-600 text-white rotate-12 scale-110 shadow-[0_0_30px_rgba(37,99,235,0.5)]' : 'bg-slate-800 text-slate-500'}`}>
                    <ShieldCheck size={32} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black tracking-tight">Secure <span className="text-blue-500">Vault</span></h3>
                    <p className="text-slate-500 font-mono text-xs mt-1">AES-256-GCM Hardware Encrypted Environment</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPass(!showPass)}
                  className={`px-8 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${
                    showPass ? 'bg-rose-500 text-white shadow-lg shadow-rose-900/40' : 'bg-slate-800 text-blue-400 hover:bg-slate-700'
                  }`}
                >
                  {showPass ? 'Lock Session' : 'Authenticate'}
                </button>
              </div>

              <div className="space-y-6 relative z-10">
                {[
                  { title: 'SSH Root Access', user: 'fishifox_dev', pass: 'FF-8812-UX_PRO', color: 'blue' },
                  { title: 'MySQL Production', user: 'admin_softvibe', pass: 'sv_prod_2024_!', color: 'emerald' },
                  { title: 'AWS Cloudfront Secret', user: 'AKIA...JJA', pass: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', color: 'amber' },
                ].map((item, i) => (
                  <div key={i} className="bg-slate-900/50 p-7 rounded-[2.5rem] border border-slate-800/60 hover:border-blue-500/30 transition-all group/item">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div className="w-full">
                        <div className="flex items-center gap-2 mb-2">
                           <div className={`w-1.5 h-1.5 rounded-full bg-${item.color}-500 shadow-[0_0_8px] shadow-${item.color}-500/50`}></div>
                           <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">{item.title}</p>
                        </div>
                        <div className="flex items-center gap-6 font-mono text-sm">
                          <div className="flex flex-col">
                            <span className="text-slate-600 text-[10px] font-bold mb-1">USER</span>
                            <span className="text-slate-200 truncate max-w-[120px]">{item.user}</span>
                          </div>
                          <div className="h-8 w-px bg-slate-800"></div>
                          <div className="flex flex-col">
                            <span className="text-slate-600 text-[10px] font-bold mb-1">PHRASE</span>
                            <span className={`transition-all duration-300 ${showPass ? 'text-blue-400' : 'text-slate-700 tracking-[0.3em] font-black blur-sm'}`}>
                              {showPass ? item.pass : '************'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                         <button className="p-4 bg-slate-800 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
                            <ExternalLink size={20} />
                         </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
           <div className="bg-white p-10 rounded-[3rem] border border-slate-200/50 shadow-sm">
             <div className="flex items-center justify-between mb-10">
               <div>
                 <h3 className="text-2xl font-black text-slate-900">Project Assets</h3>
                 <p className="text-slate-400 text-sm font-medium">Agreement docs, wireframes and specifications.</p>
               </div>
               <button className="px-6 py-3 bg-slate-50 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-100 hover:bg-slate-100 transition-all flex items-center gap-2">
                 <Plus size={18} /> Add Document
               </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Architecture_v2.pdf', type: 'Design', size: '12.4 MB', date: 'Feb 02' },
                  { name: 'Legal_Binding.docx', type: 'Contract', size: '850 KB', date: 'Jan 15' },
                  { name: 'Production_Env.yml', type: 'Config', size: '12 KB', date: 'Mar 10' },
                  { name: 'Assets_Package.zip', type: 'Archive', size: '145 MB', date: 'Mar 12' }
                ].map((doc, i) => (
                  <div key={i} className="p-5 rounded-3xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                          <FileText size={24} />
                       </div>
                       <div>
                         <p className="text-sm font-black text-slate-800 truncate max-w-[150px]">{doc.name}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{doc.type} • {doc.size}</p>
                       </div>
                    </div>
                    <button className="p-3 text-slate-400 hover:text-blue-600 transition-colors">
                      <Download size={20} />
                    </button>
                  </div>
                ))}
             </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetails;
