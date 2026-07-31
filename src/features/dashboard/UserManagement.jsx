import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import API from '../../config/api';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const { data } = await API.get('/employees/all');
      setUsers(data.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete the account for ${name}?`)) return;
    try {
      await API.delete(`/employees/${id}`);
      setUsers(users.filter(u => u._id !== id));
      alert(`User ${name} removed successfully.`);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete user.');
    }
  };

  return (
    <DashboardLayout isAdmin={true}>
      <div className="w-full space-y-8 p-1 text-slate-700 animate-fade-in-up">
        
        {/* Header */}
        <div className="pb-2 border-b border-slate-200/50">
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">User Management</h1>
          <p className="text-slate-500 text-xs mt-2 uppercase font-bold tracking-[0.15em]">Manage staff accounts and permissions</p>
        </div>

        {/* Users Table */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-md">
          {loading ? (
            <p className="text-center py-10 text-slate-400 font-bold uppercase tracking-wider">Loading users...</p>
          ) : (
            <>
              {/* Mobile Card List View (Fits 100% on mobile screens — zero side scroll) */}
              <div className="block md:hidden space-y-3">
                {users.length > 0 ? (
                  users.map(u => (
                    <div key={u._id} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-sm">{u.name}</span>
                        <span className={`px-2.5 py-1 rounded-xl text-[9px] font-bold uppercase tracking-wider border ${u.role === 'Admin' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                          {u.role}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs pt-1 border-t border-slate-100">
                        <div>
                          <span className="text-slate-400 font-semibold block text-[9px] uppercase tracking-wider">Email</span>
                          <span className="font-medium text-slate-700 break-all">{u.email}</span>
                        </div>
                        <div className="pt-1">
                          <span className="text-slate-400 font-semibold block text-[9px] uppercase tracking-wider">Department</span>
                          <span className="font-medium text-slate-600">{u.department || '—'}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex justify-end">
                        <button
                          onClick={() => handleDelete(u._id, u.name)}
                          disabled={u.email === 'admin@uom.lk'}
                          className={`w-full py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition ${
                            u.email === 'admin@uom.lk'
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                          }`}
                        >
                          Remove Account
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400 font-bold uppercase tracking-wider text-xs">No users found.</div>
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-4 pl-4">Name</th>
                      <th className="py-4">Email</th>
                      <th className="py-4">Department</th>
                      <th className="py-4">Role</th>
                      <th className="py-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {users.map(user => (
                      <tr key={user._id} className="hover:bg-slate-50/50 transition">
                        <td className="py-4 pl-4 font-bold text-slate-800">{user.name}</td>
                        <td className="py-4 text-slate-600">{user.email}</td>
                        <td className="py-4 text-slate-600">{user.department}</td>
                        <td className="py-4">
                          <span className={`px-2.5 py-1 rounded-xl text-[9px] font-bold uppercase tracking-wider border ${user.role === 'Admin' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-4 text-center">
                          <button
                            onClick={() => handleDelete(user._id, user.name)}
                            disabled={user.email === 'admin@uom.lk'}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
                              user.email === 'admin@uom.lk'
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                            }`}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center py-10 text-slate-400">No users found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
