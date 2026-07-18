import { useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';

export default function ActivityHistory() {
  const { fetchDeliveries, deliveryRequests, user } = useAuth();

  useEffect(() => {
    fetchDeliveries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter deliveries for the current user
  const mySentDeliveries = deliveryRequests.filter(req =>
    req.senderEmail?.toLowerCase() === user?.email?.toLowerCase()
  );
  
  const myReceivedDeliveries = deliveryRequests.filter(req =>
    req.recipientEmail?.toLowerCase() === user?.email?.toLowerCase()
  );
  
  const allMyDeliveries = [...new Map(
    [...mySentDeliveries, ...myReceivedDeliveries].map(d => [d._id, d])
  ).values()];

  // Sort by date descending
  allMyDeliveries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <DashboardLayout>
      <div className="w-full space-y-8 text-slate-700 animate-fade-in-up">
        {/* Header */}
        <div className="pb-6 border-b border-slate-200/50">
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Activity History</h1>
          <p className="text-slate-500 text-xs mt-2 uppercase font-bold tracking-[0.15em]">Detailed log of your deliveries and requests</p>
        </div>

        {/* Deliveries Table */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">All Delivery Records</h3>
            <span className="text-xs bg-slate-100 text-slate-500 border border-slate-200 px-4 py-1.5 rounded-full font-bold uppercase tracking-widest">
              {allMyDeliveries.length} Records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-slate-100 text-slate-500 font-bold uppercase tracking-widest text-xs">
                  <th className="py-4 pl-3">Date</th>
                  <th className="py-4">Ref ID</th>
                  <th className="py-4">Role</th>
                  <th className="py-4">Counterparty</th>
                  <th className="py-4">Item</th>
                  <th className="py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 text-slate-600">
                {allMyDeliveries.length > 0 ? (
                  allMyDeliveries.map((d) => {
                    const isSender = d.senderEmail?.toLowerCase() === user?.email?.toLowerCase();
                    return (
                      <tr key={d._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-5 pl-3 text-slate-500 font-medium">
                          {new Date(d.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-5 font-bold text-slate-500 text-xs tracking-wider">
                          {d._id?.slice(-6).toUpperCase()}
                        </td>
                        <td className="py-5">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${isSender ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                            {isSender ? 'Sender' : 'Recipient'}
                          </span>
                        </td>
                        <td className="py-5 font-semibold text-slate-700">
                          {isSender ? d.recipientName : d.employeeId?.name}
                        </td>
                        <td className="py-5 font-semibold text-slate-800">{d.description || 'Documents'}</td>
                        <td className="py-5 text-center">
                          <span className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-widest border shadow-sm ${
                            d.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                            d.status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-200' :
                            ['Requested', 'Awaiting Pickup'].includes(d.status) ? 'bg-amber-50 text-amber-600 border-amber-200' :
                            'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-slate-500 font-bold uppercase tracking-widest text-sm">
                      <span className="text-3xl block mb-2 opacity-50 grayscale">📭</span>
                      No delivery history found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
