import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import API from '../api';

const DEPARTMENTS = [
  'Department of Information Technology',
  'Department of Computational Technology',
  'Department of Interdisciplinary Studies'
];

const ROOMS = [
  'Dean\'s Office',
  'IT Room 101',
  'IT Room 102',
  'IT Lab 201',
  'CT Room 103',
  'CT Lab 202',
  'IDS Room 104',
  'IDS Lab 203',
  'Lecture Hall A',
  'Lecture Hall B',
  'Staff Room',
  'Conference Room'
];

export default function CreateDelivery() {
  const navigate = useNavigate();
  const { user, addNotification, fetchDeliveries } = useAuth();

  const [formData, setFormData] = useState({
    recipientEmail: '',
    recipientName: '',
    recipientDepartment: '',
    senderRoom: '',
    recipientRoom: '',
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState(null);
  const [recipientLookupStatus, setRecipientLookupStatus] = useState('');

  // Resolve logged-in user's MongoDB employee ID
  useEffect(() => {
    const resolveEmployeeId = async () => {
      if (!user?.email) return;
      try {
        const response = await API.get(`/employees/find/${encodeURIComponent(user.email)}`);
        if (response.data.success) {
          setEmployeeId(response.data.data._id);
        }
      } catch (error) {
        console.error('Error resolving employee ID:', error);
      }
    };
    resolveEmployeeId();
  }, [user]);

  // Lookup recipient name by email when email field is filled
  const handleRecipientEmailBlur = async () => {
    const email = formData.recipientEmail.trim().toLowerCase();
    if (!email) return;
    setRecipientLookupStatus('Searching...');
    try {
      const response = await API.get(`/employees/find/${encodeURIComponent(email)}`);
      if (response.data.success) {
        const found = response.data.data;
        setFormData(prev => ({
          ...prev,
          recipientName: found.name,
          recipientDepartment: found.department
        }));
        setRecipientLookupStatus(`✅ Found: ${found.name}`);
      } else {
        setRecipientLookupStatus('❌ Staff member not found in system.');
      }
    } catch {
      setRecipientLookupStatus('❌ Staff member not found in system.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'recipientEmail') setRecipientLookupStatus('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employeeId) {
      alert('Could not verify your staff account. Please log out and log in again.');
      return;
    }
    if (!formData.recipientName) {
      alert('Please enter a valid recipient email to auto-resolve their name.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        employeeId,
        senderEmail: user.email,
        recipientEmail: formData.recipientEmail.trim().toLowerCase(),
        recipientName: formData.recipientName,
        pickupLocation: formData.senderRoom,
        deliveryDestination: `${formData.recipientDepartment} — ${formData.recipientRoom}`,
        description: formData.description
      };

      const response = await API.post('/deliveries/request', payload);

      if (response.data.success) {
        addNotification(
          'Delivery Request Sent',
          `Your request has been sent to ${formData.recipientName}. Waiting for their confirmation.`
        );
        await fetchDeliveries();
        alert(`✅ Request sent to ${formData.recipientName}!\n\nThey will receive a notification to confirm before the robot is dispatched.`);
        navigate('/user/dashboard');
      }
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to submit request. Please check your connection.';
      alert(`❌ ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full max-w-3xl mx-auto space-y-6 p-1 text-slate-700">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">New Delivery Request</h1>
          <p className="text-slate-500 text-xs mt-1 uppercase font-semibold tracking-wider">
            Send documents or items to another staff member
          </p>
        </div>

        {/* Workflow Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6 text-sm text-blue-800 leading-relaxed shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">🤖</span>
            <h3 className="font-extrabold text-lg tracking-tight">How Robotic Delivery Works</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/60 p-4 rounded-2xl border border-blue-100">
              <span className="block text-[10px] font-black uppercase text-blue-500 mb-1">Step 1</span>
              <p className="font-bold text-slate-700 mb-1">Request</p>
              <p className="text-xs text-slate-500">You fill out this form to request a document delivery to another lecturer.</p>
            </div>
            <div className="bg-white/60 p-4 rounded-2xl border border-blue-100">
              <span className="block text-[10px] font-black uppercase text-blue-500 mb-1">Step 2</span>
              <p className="font-bold text-slate-700 mb-1">Confirm</p>
              <p className="text-xs text-slate-500">The recipient receives a pop-up and confirms they are available to receive it.</p>
            </div>
            <div className="bg-white/60 p-4 rounded-2xl border border-blue-100">
              <span className="block text-[10px] font-black uppercase text-blue-500 mb-1">Step 3</span>
              <p className="font-bold text-slate-700 mb-1">Dispatch</p>
              <p className="text-xs text-slate-500">The system syncs with the Raspberry Pi ROS. The robot travels to your room for pickup.</p>
            </div>
            <div className="bg-white/60 p-4 rounded-2xl border border-blue-100">
              <span className="block text-[10px] font-black uppercase text-blue-500 mb-1">Step 4</span>
              <p className="font-bold text-slate-700 mb-1">Deliver</p>
              <p className="text-xs text-slate-500">Once loaded, the robot navigates to the recipient's room for the final drop-off.</p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-md">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Recipient Email */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                📧 Recipient's University Email
              </label>
              <input
                type="email"
                name="recipientEmail"
                value={formData.recipientEmail}
                onChange={handleChange}
                onBlur={handleRecipientEmailBlur}
                placeholder="recipient@uom.lk"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 text-sm transition"
              />
              {recipientLookupStatus && (
                <p className={`mt-1.5 text-xs font-medium ${recipientLookupStatus.startsWith('✅') ? 'text-emerald-600' : 'text-red-500'}`}>
                  {recipientLookupStatus}
                </p>
              )}
            </div>

            {/* Recipient Name & Department (auto-filled) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  👤 Recipient's Name
                </label>
                <input
                  type="text"
                  name="recipientName"
                  value={formData.recipientName}
                  onChange={handleChange}
                  placeholder="Auto-filled from email"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 text-sm transition"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  🏢 Recipient's Department
                </label>
                <select
                  name="recipientDepartment"
                  value={formData.recipientDepartment}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 text-sm cursor-pointer transition"
                >
                  <option value="">Select department</option>
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pickup and Delivery Locations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  📍 Your Location (Pickup Point)
                </label>
                <select
                  name="senderRoom"
                  value={formData.senderRoom}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 text-sm cursor-pointer transition"
                >
                  <option value="">Select your room / location</option>
                  {ROOMS.map(room => (
                    <option key={room} value={room}>{room}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  🎯 Delivery Location (Recipient's Room)
                </label>
                <select
                  name="recipientRoom"
                  value={formData.recipientRoom}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 text-sm cursor-pointer transition"
                >
                  <option value="">Select recipient's room</option>
                  {ROOMS.map(room => (
                    <option key={room} value={room}>{room}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                📂 Item Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 text-sm transition resize-none"
                placeholder="E.g., Assignment papers, Lab reports, Official documents..."
              />
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-md active:scale-[0.98] text-xs uppercase tracking-wider disabled:opacity-50"
              >
                {loading ? 'Sending Request...' : 'Send Delivery Request'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/user/dashboard')}
                className="px-6 py-3.5 bg-white border border-slate-200 text-slate-500 font-bold rounded-xl hover:bg-slate-50 transition text-xs uppercase tracking-wider"
              >
                Cancel
              </button>
            </div>

          </form>
        </div>

      </div>
    </DashboardLayout>
  );
}