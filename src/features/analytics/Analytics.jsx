import { useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Analytics() {
  const { fetchDeliveries, deliveryRequests } = useAuth();

  useEffect(() => {
    fetchDeliveries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalRequests = deliveryRequests.length;
  const completedRequests = deliveryRequests.filter(d => d.status === 'Completed').length;
  const successRate = totalRequests > 0 ? ((completedRequests / totalRequests) * 100).toFixed(1) : '0';

  const deliveryData = [
    { name: 'Mon', Deliveries: 0 },
    { name: 'Tue', Deliveries: 0 },
    { name: 'Wed', Deliveries: 0 },
    { name: 'Thu', Deliveries: 0 },
    { name: 'Fri', Deliveries: 0 },
  ];

  return (
    <DashboardLayout isAdmin={true}>
      <div className="w-full space-y-8 text-slate-700 animate-fade-in-up">
        
        {/* Header */}
        <div className="pb-2 border-b border-slate-200/50">
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Delivery Analytics</h1>
          <p className="text-slate-500 text-xs mt-2 uppercase font-bold tracking-[0.15em]">Logistics data and system statistics</p>
        </div>

        {/* Analytics Mini Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-3xl shadow-sm space-y-1 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest relative z-10">Total Deliveries</span>
            <p className="text-4xl font-black text-slate-800 relative z-10">{totalRequests}</p>
            <span className="text-[10px] text-slate-400 font-extrabold flex items-center gap-1 mt-2 relative z-10">
              No recent activity
            </span>
          </div>
          
          <div className="glass-card p-6 rounded-3xl shadow-sm space-y-1 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest relative z-10">Success Rate</span>
            <p className="text-4xl font-black text-slate-800 relative z-10">{successRate}%</p>
            <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1 mt-2 relative z-10">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span> Healthy status
            </span>
          </div>

          <div className="glass-card p-6 rounded-3xl shadow-sm space-y-1 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest relative z-10">Avg Delivery Time</span>
            <p className="text-4xl font-black text-slate-800 relative z-10">0 <span className="text-xl text-slate-400">min</span></p>
            <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1 mt-2 relative z-10">
              Pathways clear
            </span>
          </div>
        </div>

        {/* Bar Chart Section */}
        <div className="glass-card p-8 rounded-3xl shadow-sm">
          <div className="mb-8">
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Deliveries Per Day</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Total completed deliveries per day this week</p>
          </div>
          
          {/* Chart Container */}
          <div className="w-full h-96 bg-white/40 backdrop-blur-md border border-slate-200/50 p-6 rounded-2xl shadow-inner relative overflow-hidden">
             {/* Decorative grid background */}
             <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:20px_20px]"></div>
            <ResponsiveContainer width="100%" height="100%" className="relative z-10">
              <BarChart data={deliveryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#64748b" fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(59,130,246,0.04)' }}
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid rgba(226,232,240,0.8)', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  labelStyle={{ color: '#0f172a', fontWeight: '900', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Bar dataKey="Deliveries" fill="url(#colorDeliveries)" radius={[8, 8, 0, 0]} barSize={40} />
                <defs>
                  <linearGradient id="colorDeliveries" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
