import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getLeaveBalance, getMyLeaves, getAdminStats } from '../services/api';
import {
  CalendarPlus, Clock, CheckCircle2, XCircle,
  Users, TrendingUp, ArrowRight, RefreshCw
} from 'lucide-react';

const STATUS_STYLES = {
  pending:   'bg-amber-100  text-amber-700  border-amber-200',
  approved:  'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected:  'bg-red-100    text-red-700    border-red-200',
  cancelled: 'bg-gray-100   text-gray-500   border-gray-200'
};

function StatusBadge({ status }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

function BalanceCard({ emoji, label, value, sub, colorClass }) {
  return (
    <div className={`card p-5 border-l-4 ${colorClass}`}>
      <div className="flex justify-between items-start">
        <span className="text-2xl">{emoji}</span>
        <span className="text-3xl font-bold text-gray-900">{value}</span>
      </div>
      <p className="text-sm font-semibold text-gray-700 mt-3">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}

export default function Dashboard() {
  const { user }                = useAuth();
  const [balance, setBalance]   = useState(null);
  const [leaves, setLeaves]     = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefresh]= useState(false);

  const isAdmin = ['admin', 'manager'].includes(user?.role);

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const load = async (showSpin = false) => {
    if (showSpin) setRefresh(true);
    try {
      const [balRes, lvRes] = await Promise.all([getLeaveBalance(), getMyLeaves()]);
      setBalance(balRes.data);
      setLeaves(lvRes.data.slice(0, 6));
      if (isAdmin) {
        const stRes = await getAdminStats();
        setStats(stRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner h-10 w-10" />
      </div>
    );
  }

  const balanceCards = balance ? [
    { emoji: '🏖️', label: 'Annual Leave',  value: balance.annual_leaves,  sub: 'days remaining', colorClass: 'border-indigo-500' },
    { emoji: '🏥', label: 'Sick Leave',    value: balance.sick_leaves,    sub: 'days remaining', colorClass: 'border-rose-400'   },
    { emoji: '☀️', label: 'Casual Leave',  value: balance.casual_leaves,  sub: 'days remaining', colorClass: 'border-amber-400'  },
  ] : [];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Welcome bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greet()}, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load(true)}
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
          >
            <RefreshCw size={17} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <Link to="/apply-leave" className="btn-primary">
            <CalendarPlus size={16} />
            Apply Leave
          </Link>
        </div>
      </div>

      {/* Leave balance */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Your Leave Balance</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {balanceCards.map(c => <BalanceCard key={c.label} {...c} />)}
        </div>
      </div>

      {/* Admin stats */}
      {isAdmin && stats && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Organisation Overview</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Employees', value: stats.totalEmployees,  icon: Users,         color: 'text-indigo-600 bg-indigo-50'  },
              { label: 'Pending Review',  value: stats.pendingLeaves,   icon: Clock,         color: 'text-amber-600  bg-amber-50'   },
              { label: 'Approved',        value: stats.approvedLeaves,  icon: CheckCircle2,  color: 'text-emerald-600 bg-emerald-50'},
              { label: 'Rejected',        value: stats.rejectedLeaves,  icon: XCircle,       color: 'text-red-600    bg-red-50'     },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card p-5">
                <div className={`inline-flex p-2 rounded-xl mb-3 ${color}`}>
                  <Icon size={18} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent leave requests */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-800">Recent Leave Requests</h2>
          <Link
            to="/leave-history"
            className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {leaves.length === 0 ? (
          <div className="py-16 text-center">
            <span className="text-4xl">📭</span>
            <p className="text-gray-500 text-sm mt-3 font-medium">No leave requests yet</p>
            <Link to="/apply-leave" className="text-indigo-600 text-sm hover:underline mt-1 inline-block">
              Apply for your first leave →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {leaves.map(lv => (
              <div key={lv.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/60 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <TrendingUp size={16} className="text-indigo-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 capitalize">{lv.leave_type} Leave</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(lv.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      {' '}–{' '}
                      {new Date(lv.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' '}· {lv.days} day{lv.days > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <StatusBadge status={lv.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
