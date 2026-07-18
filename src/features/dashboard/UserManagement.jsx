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
            <div className="overflow-x-auto">
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
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
