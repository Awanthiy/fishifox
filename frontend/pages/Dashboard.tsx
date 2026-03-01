import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  Star,
  Trophy,
  Activity,
  Clock,
  RefreshCw
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000/api';

type GrowthPoint = { name: string; value: number };

type DashboardStats = {
  totalBilled: string;   // "LKR 250,000"
  customers: number;
  projects: number;
  rating: number;        // 4.8
  growth: GrowthPoint[]; // chart
};

const StatCard = ({ title, value, icon, color, isLoading }: any) => {
  const colorMap: any = {
    blue: { bg: 'bg-primary/10', text: 'text-primary' },
    orange: { bg: 'bg-secondary/10', text: 'text-secondary' },
    purple: { bg: 'bg-[#F3F2FD]', text: 'text-[#7978E9]' },
    teal: { bg: 'bg-[#E0F9FA]', text: 'text-[#4BDBE2]' },
  };
  const theme = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white p-7 rounded-[2.5rem] mindskills-shadow border border-[#F1F3FF] flex-1 group hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-center justify-between mb-5">
        <div className={`p-4 rounded-2xl ${theme.bg} ${theme.text}`}>
          {React.cloneElement(icon, { size: 22 })}
        </div>
        <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">
          LIVE DATA
        </div>
      </div>
      {isLoading ? (
        <div className="h-9 w-24 bg-slate-100 animate-pulse rounded-lg"></div>
      ) : (
        <h3 className="text-3xl font-black text-[#2F2F2F] tracking-tighter">{value}</h3>
      )}
      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{title}</p>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const controller = new AbortController();
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/dashboard`, { signal: controller.signal });
      if (!res.ok) throw new Error(`Dashboard API error: ${res.status}`);
      const json: DashboardStats = await res.json();
      setStats(json);
    } catch (e) {
      console.error(e);
      alert('Dashboard sync failed. Check backend console / Network tab.');
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chartData = stats?.growth ?? [
    { name: 'Jan', value: 120 },
    { name: 'Feb', value: 180 },
    { name: 'Mar', value: 150 },
    { name: 'Apr', value: 210 },
    { name: 'May', value: 240 },
    { name: 'Jun', value: 260 },
  ];

  return (
    <div className="space-y-10 pb-16">
      <div className="bg-white rounded-[3.5rem] p-10 md:p-14 border border-[#F1F3FF] mindskills-shadow flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 opacity-50"></div>

        <div className="flex-1 space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/5 rounded-full text-primary text-[10px] font-black uppercase tracking-widest border border-primary/5">
            <Activity size={12} />
            Operations Overview
          </div>
          <h1 className="text-5xl font-logo font-black text-[#2F2F2F] tracking-tighter leading-[1.1]">
            Management <br />
            <span className="text-primary">Performance Dashboard</span>
          </h1>
          <p className="text-base text-slate-500 max-w-lg font-medium leading-relaxed">
            Monitor real-time IT service delivery, automate billing cycles, and track project milestones through our unified cabinet interface.
          </p>
          <div className="flex gap-4 pt-4">
            <button
              onClick={loadData}
              className="bg-primary text-white px-10 py-4 rounded-2xl text-[13px] font-black uppercase tracking-widest shadow-2xl shadow-primary/25 hover:bg-primary/90 transition-all flex items-center gap-2"
            >
              {loading ? <RefreshCw size={14} className="animate-spin" /> : <Activity size={14} />}
              Sync Engine
            </button>
          </div>
        </div>

        <div className="w-72 h-72 bg-slate-50 rounded-[3.5rem] flex items-center justify-center relative overflow-hidden group shadow-inner">
          <Activity size={180} className="text-primary/5 absolute rotate-12" />
          <div className="text-center relative z-10">
            <div className="relative inline-block mb-1">
              <p className="text-6xl font-black text-primary tracking-tighter">
                {loading ? '...' : '92.4'}
              </p>
              <span className="absolute -top-1 -right-4 text-sm font-black text-secondary">%</span>
            </div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
              Platform Efficiency
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard title="Total Revenue" value={stats?.totalBilled ?? 'LKR 0'} icon={<Trophy />} color="blue" isLoading={loading} />
        <StatCard title="Total Customers" value={stats?.customers ?? 0} icon={<Users />} color="teal" isLoading={loading} />
        <StatCard title="Ongoing Projects" value={stats?.projects ?? 0} icon={<Activity />} color="purple" isLoading={loading} />
        <StatCard title="Feedback Rating" value={stats ? stats.rating.toFixed(1) : '0.0'} icon={<Star />} color="orange" isLoading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-[#F1F3FF] mindskills-shadow">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-[#2F2F2F] tracking-tight">Financial Growth</h3>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">Real-time API sync enabled</p>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3FF" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} />
                <Tooltip cursor={{ fill: '#F5F7FF' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', fontWeight: 'bold' }} />
                <Bar dataKey="value" fill="#4B49AC" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-primary text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12">
            <Clock size={160} />
          </div>
          <div className="relative z-10 flex flex-col h-full">
            <h3 className="text-2xl font-black tracking-tight mb-2">Live Cloud Logs</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-8">System health & events</p>

            <div className="space-y-4 flex-1">
              <div className="bg-white/10 p-5 rounded-2xl flex items-center gap-5 border border-white/5 group">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-xl">🚀</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black truncate">API Connection</p>
                  <p className="text-[10px] opacity-50 font-black uppercase tracking-widest mt-0.5">Healthy</p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;