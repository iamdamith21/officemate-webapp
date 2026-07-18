import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Analytics() {
  const { fetchDeliveries, deliveryRequests } = useAuth();
  const [timeRange, setTimeRange] = useState('This Week');
  const [exportFormat, setExportFormat] = useState('CSV');

  useEffect(() => {
    fetchDeliveries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const handleExport = () => {
    alert(`Generating ${timeRange} report in ${exportFormat} format...\n(Export logic would run here)`);
  };

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
        
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-200/50 gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Delivery Analytics</h1>
            <p className="text-slate-500 text-xs mt-2 uppercase font-bold tracking-[0.15em]">Logistics data and system statistics</p>
          </div>
          
          <div className="flex items-center gap-3">
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500 shadow-sm transition"
            >
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="All Time">All Time</option>
            </select>
            
            <select 
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500 shadow-sm transition"
            >
              <option value="CSV">CSV</option>
              <option value="PDF">PDF</option>
            </select>

            <button 
              onClick={handleExport}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Export
            </button>
          </div>
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
