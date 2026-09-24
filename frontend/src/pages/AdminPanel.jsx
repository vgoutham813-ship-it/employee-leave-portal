import React, { useState, useEffect, useCallback } from 'react';
import { getAllLeaves, reviewLeave } from '../services/api';
import toast from 'react-hot-toast';
import { CheckCircle2, XCircle, RefreshCw, Clock, MessageSquare, Search } from 'lucide-react';

const STATUS_STYLES = {
  pending:   'bg-amber-100  text-amber-700  border-amber-200',
  approved:  'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected:  'bg-red-100    text-red-700    border-red-200',
  cancelled: 'bg-gray-100   text-gray-500   border-gray-200',
};

const TYPE_EMOJI = {
  annual: '🏖️', sick: '🏥', casual: '☀️',
  maternity: '👶', paternity: '👨‍👧', unpaid: '📋'
};

const FILTERS = ['pending', 'all', 'approved', 'rejected', 'cancelled'];

function StatusBadge({ status }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

// ─── Review Modal ─────────────────────────────────────────────────────────────
function ReviewModal({ leave, onClose, onDone }) {
  const [comments, setComments] = useState('');
  const [loading, setLoading]   = useState(false);

  const handle = async (status) => {
    setLoading(true);
    try {
      await reviewLeave(leave.id, { status, admin_comments: comments });
      toast.success(`Leave ${status} successfully!`);
      onDone();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    } finally {
      setLoading(false);
    }
  };

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Modal header */}
        <div className="bg-slate-800 px-6 py-5">
          <h3 className="text-base font-bold text-white">Review Leave Request</h3>
          <p className="text-slate-400 text-sm mt-0.5">
            {leave.employee_name} · {leave.department}
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Request summary */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-lg">{TYPE_EMOJI[leave.leave_type] ?? '📋'}</span>
              <span className="font-semibold text-gray-800 capitalize">{leave.leave_type} Leave</span>
              <span className="text-gray-400 text-sm">({leave.days} day{leave.days !== 1 ? 's' : ''})</span>
            </div>
            <p className="text-sm text-gray-500">
              {fmtDate(leave.start_date)} → {fmtDate(leave.end_date)}
            </p>
            <p className="text-sm text-gray-600 pt-1 border-t border-gray-200">
              <strong>Reason:</strong> {leave.reason}
            </p>
          </div>

          {/* Comment box */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
              <MessageSquare size={14} />
              Add a comment <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={comments}
              onChange={e => setComments(e.target.value)}
              placeholder="Write a note for the employee…"
              rows={3}
              disabled={loading}
              className="input resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              disabled={loading}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={() => handle('rejected')}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600
                         text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors
                         disabled:opacity-50"
            >
              <XCircle size={16} />
              {loading ? 'Processing…' : 'Reject'}
            </button>
            <button
              onClick={() => handle('approved')}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700
                         text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors
                         disabled:opacity-50"
            >
              <CheckCircle2 size={16} />
              {loading ? 'Processing…' : 'Approve'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminPanel() {
  const [leaves, setLeaves]     = useState([]);
  const [filter, setFilter]     = useState('pending');
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const { data } = await getAllLeaves(params);
      setLeaves(data);
    } catch {
      toast.error('Failed to load leave requests.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  // Client-side search
  const filtered = search.trim()
    ? leaves.filter(l =>
        l.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
        l.department?.toLowerCase().includes(search.toLowerCase()) ||
        l.leave_type?.toLowerCase().includes(search.toLowerCase())
      )
    : leaves;

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Leave Requests</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {filtered.length} request{filtered.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <button
          onClick={fetchLeaves}
          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
        >
          <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Filter tabs + search row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize whitespace-nowrap transition-all
                ${filter === f
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
                }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name or dept…"
            className="input pl-9 w-full sm:w-56 py-2"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="spinner h-8 w-8" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card py-16 text-center">
          <Clock size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-semibold">
            No {filter !== 'all' ? filter : ''} leave requests
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(lv => (
            <div key={lv.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center
                                text-indigo-700 font-bold text-sm flex-shrink-0">
                  {lv.employee_name?.[0]?.toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-gray-900">{lv.employee_name}</p>
                    {lv.employee_id && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg">
                        {lv.employee_id}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{lv.department}</span>
                    <StatusBadge status={lv.status} />
                  </div>

                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {TYPE_EMOJI[lv.leave_type]} {lv.leave_type} leave
                    </span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-500">
                      {fmtDate(lv.start_date)} → {fmtDate(lv.end_date)}
                    </span>
                    <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-lg">
                      {lv.days} day{lv.days !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 mt-1.5 bg-gray-50 rounded-lg px-3 py-1.5 line-clamp-2">
                    {lv.reason}
                  </p>

                  {lv.admin_comments && (
                    <p className="text-xs text-indigo-600 mt-1.5 flex items-center gap-1">
                      <MessageSquare size={11} />
                      {lv.admin_comments}
                    </p>
                  )}

                  <p className="text-xs text-gray-400 mt-1">
                    Applied: {fmtDate(lv.created_at)}
                    {lv.reviewed_by_name && (
                      <span> · Reviewed by <strong>{lv.reviewed_by_name}</strong></span>
                    )}
                  </p>
                </div>

                {/* Review button */}
                {lv.status === 'pending' && (
                  <button
                    onClick={() => setSelected(lv)}
                    className="flex-shrink-0 btn-primary py-2 px-4 text-sm"
                  >
                    Review
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review modal */}
      {selected && (
        <ReviewModal
          leave={selected}
          onClose={() => setSelected(null)}
          onDone={fetchLeaves}
        />
      )}
    </div>
  );
}
