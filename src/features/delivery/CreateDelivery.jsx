import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import API from '../../config/api';
import { DEPARTMENTS, NAV_LOCATIONS } from '../../constants';
import { useDeliveryMission } from '../../hooks/useDeliveryMission';

export default function CreateDelivery() {
  const navigate = useNavigate();
  const { user, addNotification, fetchDeliveries } = useAuth();
  // Placing a request used to POST to Mongo and stop there. The Express API has
  // no ROS client, so nothing ever reached the robot and the mission FSM sat in
  // IDLE — the request was recorded and emailed, and the robot never moved.
  // Dispatching from here is what closes that gap for the USER flow; before
  // this, only an admin pressing Dispatch on AdminDashboard could start a run.
  const { dispatch: dispatchMission } = useDeliveryMission();

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

  // Lookup recipient details when name or email field is blurred
  const handleRecipientNameBlur = async () => {
    const name = formData.recipientName.trim();
    if (!name) return;
    setRecipientLookupStatus('Searching...');
    try {
      const response = await API.get(`/employees/find-by-name/${encodeURIComponent(name)}`);
      if (response.data.success) {
        const found = response.data.data;
        setFormData(prev => ({
          ...prev,
          recipientEmail: found.email,
          recipientDepartment: found.department
        }));
        setRecipientLookupStatus(`✅ Found registered email: ${found.email}`);
      } else {
        setRecipientLookupStatus('⚠️ Staff member not found by name. Please verify or enter email.');
      }
    } catch {
      setRecipientLookupStatus('⚠️ Staff member not found by name. Please verify or enter email.');
    }
  };

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
        setRecipientLookupStatus(`✅ Found staff: ${found.name}`);
      } else {
        setRecipientLookupStatus('❌ Staff member not found by email.');
      }
    } catch {
      setRecipientLookupStatus('❌ Staff member not found by email.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'recipientEmail' || name === 'recipientName') setRecipientLookupStatus('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employeeId) {
      alert('Could not verify your staff account. Please log out and log in again.');
      return;
    }
    if (!formData.recipientEmail || !formData.recipientName) {
      alert('Please enter a recipient name or email to auto-resolve recipient details.');
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
          'Delivery Request Placed',
          `Your delivery request to ${formData.recipientName} has been submitted successfully.`
        );
        await fetchDeliveries();

        // Hand the saved record straight to the robot. dispatchMission resolves
        // BOTH ends against the surveyed locations before sending anything, so a
        // destination the robot has never been surveyed at is refused here
        // rather than stranding it mid-run.
        //
        // The request is deliberately still treated as placed when dispatch
        // fails: it is saved, the recipient has been emailed, and an admin can
        // dispatch it later from the dashboard. Silently discarding a saved
        // request because the robot happened to be offline would be worse.
        const created = response.data.data;
        const sent = created ? dispatchMission(created) : false;

        alert(
          `✅ Delivery request for ${formData.recipientName} submitted successfully!\n\n` +
          (sent
            ? `🤖 Robot dispatched: Navigation goal sent to ${formData.recipientRoom}.`
            : `📬 Once ${formData.recipientName} accepts the delivery request, the robot will automatically navigate to ${formData.recipientRoom}.`)
        );
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
      <div className="w-full max-w-5xl mx-auto space-y-6 p-1 text-slate-700">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">New Delivery Request</h1>
          <p className="text-slate-500 text-xs mt-1 uppercase font-semibold tracking-wider">
            Send documents or items to another staff member
          </p>
        </div>

        {/* Workflow steps — compact stepper */}
        <div className="bg-blue-50 border border-blue-200 rounded-3xl p-5 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { n: '1', t: 'Place Order', d: 'No admin permission needed' },
              { n: '2', t: 'Pickup', d: 'Robot collects from you' },
              { n: '3', t: 'Deliver', d: 'Robot drops off' },
              { n: '4', t: 'Alert Sent', d: 'Email sent to recipient' },
            ].map(s => (
              <div key={s.n} className="flex items-center gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center">{s.n}</span>
                <div className="min-w-0">
                  <p className="font-bold text-slate-700 text-sm leading-tight">{s.t}</p>
                  <p className="text-xs text-slate-500 leading-tight truncate">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-md">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Recipient Name & Department */}
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
                  onBlur={handleRecipientNameBlur}
                  placeholder="Enter staff member's name"
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

            {/* Recipient Email (auto-fetched or custom) */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                📧 Recipient's Staff Email
              </label>
              <input
                type="email"
                name="recipientEmail"
                value={formData.recipientEmail}
                onChange={handleChange}
                onBlur={handleRecipientEmailBlur}
                placeholder="Auto-fetched from name or enter recipient@uom.lk"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 text-sm transition"
              />
              {recipientLookupStatus && (
                <p className={`mt-1.5 text-xs font-medium ${recipientLookupStatus.startsWith('✅') ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {recipientLookupStatus}
                </p>
              )}
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
                  {NAV_LOCATIONS.map(loc => (
                    <option key={loc.id} value={loc.label}>
                      {loc.label} (x: {loc.dock.x > 0 ? `+${loc.dock.x.toFixed(2)}` : loc.dock.x.toFixed(2)}m, y: {loc.dock.y > 0 ? `+${loc.dock.y.toFixed(2)}` : loc.dock.y.toFixed(2)}m)
                    </option>
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
                  {NAV_LOCATIONS.map(loc => (
                    <option key={loc.id} value={loc.label}>
                      {loc.label} (x: {loc.dock.x > 0 ? `+${loc.dock.x.toFixed(2)}` : loc.dock.x.toFixed(2)}m, y: {loc.dock.y > 0 ? `+${loc.dock.y.toFixed(2)}` : loc.dock.y.toFixed(2)}m)
                    </option>
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
