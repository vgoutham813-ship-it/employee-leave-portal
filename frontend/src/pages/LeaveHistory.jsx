import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getMyLeaves, cancelLeave } from '../services/api';
import toast from 'react-hot-toast';
import { CalendarPlus, RefreshCw, X, MessageSquare } from 'lucide-react';

const STATUS_STYLES = {
  pending:   { chip: 'bg-amber-100  text-amber-700  border-amber-200',  dot: 'bg-amber-400'   },
  approved:  { chip: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  rejected:  { chip: 'bg-red-100    text-red-700    border-red-200',    dot: 'bg-red-400'     },
  cancelled: { chip: 'bg-gray-100   text-gray-500   border-gray-200',   dot: 'bg-gray-400'    },
};

const TYPE_EMOJI = {
  annual: '🏖️', sick: '🏥', casual: '☀️',
  maternity: '👶', paternity: '👨‍👧', unpaid: '📋'
};

const FILTERS = ['all', 'pending', 'approved', 'rejected', 'cancelled'];

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize ${s.chip}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

function LeaveCard({ leave, onCancel }) {
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this leave request?')) return;
    setCancelling(true);
    try {
      await onCancel(leave.id);
    } finally {
      setCancelling(false);
    }
  };

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* Type icon */}
        <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-xl flex-shrink-0">
          {TYPE_EMOJI[leave.leave_type] ?? '📋'}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-gray-900 capitalize">
              {leave.leave_type} Leave
            </h3>
            <StatusBadge status={leave.status} />
          </div>

          <p className="text-sm text-gray-500 mt-1">
            📅 {fmtDate(leave.start_date)} → {fmtDate(leave.end_date)}
            <span className="ml-2 font-semibold text-gray-700">
              ({leave.days} day{leave.days !== 1 ? 's' : ''})
            </span>
          </p>

          <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg px-3 py-2 line-clamp-2">
            {leave.reason}
          </p>

          {leave.admin_comments && (
            <div className="flex items-start gap-2 mt-2 bg-indigo-50 text-indigo-700 rounded-lg px-3 py-2">
              <MessageSquare size={13} className="flex-shrink-0 mt-0.5" />
              <p className="text-xs">{leave.admin_comments}</p>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-2">
            Applied on{' '}
            {new Date(leave.created_at).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'long', year: 'numeric'
            })}
            {leave.reviewed_by_name && (
              <span> · Reviewed by <strong>{leave.reviewed_by_name}</strong></span>
            )}
          </p>
        </div>

        {/* Cancel button */}
        {leave.status === 'pending' && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                       text-red-600 bg-red-50 hover:bg-red-100 border border-red-200
                       rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={13} />
            {cancelling ? 'Cancelling…' : 'Cancel'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function LeaveHistory() {
  const [leaves, setLeaves]   = useState([]);
  const [filter, setFilter]   = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getMyLeaves();
      setLeaves(data);
    } catch {
      toast.error('Failed to load leave history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  const handleCancel = async (id) => {
    try {
      await cancelLeave(id);
      toast.success('Leave request cancelled.');
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel leave.');
    }
  };

  const filtered = filter === 'all' ? leaves : leaves.filter(l => l.status === filter);

  // Summary counts
  const counts = FILTERS.slice(1).reduce((acc, s) => {
    acc[s] = leaves.filter(l => l.status === s).length;
    return acc;
  }, {});

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Leave History</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {leaves.length} total request{leaves.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLeaves}
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
          >
            <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link to="/apply-leave" className="btn-primary">
            <CalendarPlus size={15} />
            New Request
          </Link>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTERS.map(f => {
          const cnt = f === 'all' ? leaves.length : counts[f];
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold
                          capitalize whitespace-nowrap transition-all
                ${filter === f
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
                }`}
            >
              {f}
              {cnt > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
                  ${filter === f ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {cnt}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="spinner h-8 w-8" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card py-16 text-center">
          <span className="text-4xl">📭</span>
          <p className="text-gray-600 font-semibold mt-3">
            {filter === 'all' ? 'No leave requests yet' : `No ${filter} leaves`}
          </p>
          {filter === 'all' && (
            <Link to="/apply-leave" className="text-indigo-600 text-sm hover:underline mt-2 inline-block">
              Apply for leave →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(lv => (
            <LeaveCard key={lv.id} leave={lv} onCancel={handleCancel} />
          ))}
        </div>
      )}
    </div>
  );
}
