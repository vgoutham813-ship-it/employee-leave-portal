import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { applyLeave, getLeaveBalance } from '../services/api';
import toast from 'react-hot-toast';
import { CalendarPlus, Info, ArrowLeft } from 'lucide-react';

const LEAVE_TYPES = [
  { value: 'annual',     label: '🏖️  Annual Leave',     field: 'annual_leaves',    desc: 'Planned vacation or personal time off' },
  { value: 'sick',       label: '🏥  Sick Leave',        field: 'sick_leaves',      desc: 'Medical illness or health-related absence' },
  { value: 'casual',     label: '☀️  Casual Leave',      field: 'casual_leaves',    desc: 'Short unplanned or personal leave' },
  { value: 'maternity',  label: '👶  Maternity Leave',   field: 'maternity_leaves', desc: 'Leave for childbirth and new-born care' },
  { value: 'paternity',  label: '👨‍👧  Paternity Leave',  field: 'paternity_leaves', desc: 'Leave for new fathers after childbirth' },
  { value: 'unpaid',     label: '📋  Unpaid Leave',      field: null,               desc: 'Leave without pay when balance is exhausted' },
];

function countWorkingDays(s, e) {
  if (!s || !e) return 0;
  const start = new Date(s), end = new Date(e);
  if (start > end) return 0;
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const d = cur.getDay();
    if (d !== 0 && d !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export default function ApplyLeave() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(null);
  const [form, setForm]       = useState({
    leave_type: 'annual', start_date: '', end_date: '', reason: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getLeaveBalance().then(r => setBalance(r.data)).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const today         = new Date().toISOString().split('T')[0];
  const workingDays   = countWorkingDays(form.start_date, form.end_date);
  const selectedType  = LEAVE_TYPES.find(t => t.value === form.leave_type);
  const availableDays = balance && selectedType?.field ? balance[selectedType.field] : null;
  const isInsufficient = availableDays !== null && workingDays > availableDays;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.start_date || !form.end_date) return toast.error('Please select start and end dates.');
    if (workingDays === 0)    return toast.error('No working days in the selected range.');
    if (isInsufficient)       return toast.error(`Insufficient balance. Available: ${availableDays} days.`);

    setLoading(true);
    try {
      const { data } = await applyLeave(form);
      toast.success(`Leave applied for ${data.days} working day${data.days !== 1 ? 's' : ''}!`);
      navigate('/leave-history');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit leave request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Apply for Leave</h1>
          <p className="text-gray-400 text-sm mt-0.5">Submit a new leave request for approval</p>
        </div>
      </div>

      {/* Quick balance preview */}
      {balance && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Annual',  val: balance.annual_leaves,  color: 'bg-indigo-50 border-indigo-100 text-indigo-700' },
            { label: 'Sick',    val: balance.sick_leaves,    color: 'bg-rose-50   border-rose-100   text-rose-700'   },
            { label: 'Casual',  val: balance.casual_leaves,  color: 'bg-amber-50  border-amber-100  text-amber-700'  },
          ].map(({ label, val, color }) => (
            <div key={label} className={`border rounded-xl p-3 text-center ${color}`}>
              <p className="text-xl font-bold">{val}</p>
              <p className="text-xs font-medium mt-0.5">{label} days left</p>
            </div>
          ))}
        </div>
      )}

      {/* Form card */}
      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Leave type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {LEAVE_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, leave_type: value }))}
                  className={`text-left px-3 py-2.5 rounded-xl border text-sm font-medium transition-all
                    ${form.leave_type === value
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                      : 'border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50/50'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {selectedType && (
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <Info size={11} /> {selectedType.desc}
              </p>
            )}
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
              <input
                type="date"
                value={form.start_date}
                min={today}
                onChange={set('start_date')}
                required
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
              <input
                type="date"
                value={form.end_date}
                min={form.start_date || today}
                onChange={set('end_date')}
                required
                className="input"
              />
            </div>
          </div>

          {/* Working days preview */}
          {workingDays > 0 && (
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium
              ${isInsufficient
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}>
              <span className="text-lg">{isInsufficient ? '⚠️' : '✅'}</span>
              <span>
                {workingDays} working day{workingDays !== 1 ? 's' : ''} selected
                {availableDays !== null && (
                  <span className="font-normal text-current/70">
                    {' '}· {availableDays} available
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason for Leave</label>
            <textarea
              value={form.reason}
              onChange={set('reason')}
              placeholder="Briefly describe the reason for your leave request…"
              required
              rows={4}
              className="input resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isInsufficient}
              className="btn-primary flex-1"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="spinner h-4 w-4" /> Submitting…
                </span>
              ) : (
                <><CalendarPlus size={16} /> Submit Request</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
