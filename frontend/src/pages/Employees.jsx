import React, { useState, useEffect, useCallback } from 'react';
import { getAllEmployees, updateEmployeeRole } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { RefreshCw, Search, Users } from 'lucide-react';

const ROLE_STYLES = {
  admin:    'bg-purple-100 text-purple-700 border-purple-200',
  manager:  'bg-blue-100   text-blue-700   border-blue-200',
  employee: 'bg-gray-100   text-gray-600   border-gray-200',
};

const DEPT_COLORS = [
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
  'bg-sky-100 text-sky-700',
  'bg-indigo-100 text-indigo-700',
  'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700',
  'bg-teal-100 text-teal-700',
];

function deptColor(dept) {
  let sum = 0;
  for (let c of (dept || '')) sum += c.charCodeAt(0);
  return DEPT_COLORS[sum % DEPT_COLORS.length];
}

function RoleBadge({ role }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize ${ROLE_STYLES[role] ?? ROLE_STYLES.employee}`}>
      {role}
    </span>
  );
}

export default function Employees() {
  const { user }                   = useAuth();
  const [employees, setEmployees]  = useState([]);
  const [search, setSearch]        = useState('');
  const [deptFilter, setDeptFilter]= useState('All');
  const [loading, setLoading]      = useState(true);
  const [updatingId, setUpdating]  = useState(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getAllEmployees();
      setEmployees(data);
    } catch {
      toast.error('Failed to load employees.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const handleRoleChange = async (id, role) => {
    setUpdating(id);
    try {
      await updateEmployeeRole(id, role);
      toast.success('Role updated successfully.');
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role.');
    } finally {
      setUpdating(null);
    }
  };

  // Unique departments for filter
  const departments = ['All', ...Array.from(new Set(employees.map(e => e.department).filter(Boolean))).sort()];

  // Filter logic
  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    const matchSearch =
      e.name?.toLowerCase().includes(q) ||
      e.email?.toLowerCase().includes(q) ||
      e.employee_id?.toLowerCase().includes(q) ||
      e.department?.toLowerCase().includes(q);
    const matchDept = deptFilter === 'All' || e.department === deptFilter;
    return matchSearch && matchDept;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {employees.length} total · {filtered.length} shown
          </p>
        </div>
        <button
          onClick={fetchEmployees}
          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
        >
          <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Search + dept filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, or ID…"
            className="input pl-9"
          />
        </div>
        <select
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
          className="input sm:w-48 bg-white"
        >
          {departments.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="spinner h-8 w-8" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card py-16 text-center">
          <Users size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-semibold">No employees found</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="card overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Employee', 'Department', 'Leave Balance', 'Role', 'Joined'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase
                                             tracking-wider px-5 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(emp => (
                    <tr key={emp.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Employee */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center
                                          text-indigo-700 font-bold text-sm flex-shrink-0">
                            {emp.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{emp.name}</p>
                            <p className="text-xs text-gray-400">{emp.email}</p>
                            {emp.employee_id && (
                              <p className="text-xs text-gray-400">{emp.employee_id}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${deptColor(emp.department)}`}>
                          {emp.department || 'General'}
                        </span>
                      </td>

                      {/* Balance */}
                      <td className="px-5 py-4">
                        <div className="flex gap-1.5 flex-wrap">
                          <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg font-semibold">
                            A: {emp.annual_leaves ?? 0}
                          </span>
                          <span className="text-xs bg-rose-50 text-rose-700 px-2 py-0.5 rounded-lg font-semibold">
                            S: {emp.sick_leaves ?? 0}
                          </span>
                          <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg font-semibold">
                            C: {emp.casual_leaves ?? 0}
                          </span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-4">
                        {user?.role === 'admin' && emp.id !== user?.id ? (
                          <select
                            value={emp.role}
                            onChange={e => handleRoleChange(emp.id, e.target.value)}
                            disabled={updatingId === emp.id}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5
                                       focus:outline-none focus:ring-2 focus:ring-indigo-500
                                       bg-white capitalize disabled:opacity-50"
                          >
                            {['employee', 'manager', 'admin'].map(r => (
                              <option key={r} value={r} className="capitalize">{r}</option>
                            ))}
                          </select>
                        ) : (
                          <RoleBadge role={emp.role} />
                        )}
                      </td>

                      {/* Joined */}
                      <td className="px-5 py-4">
                        <span className="text-xs text-gray-400">
                          {new Date(emp.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map(emp => (
              <div key={emp.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center
                                  text-indigo-700 font-bold flex-shrink-0">
                    {emp.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900 text-sm">{emp.name}</p>
                      <RoleBadge role={emp.role} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{emp.email}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${deptColor(emp.department)}`}>
                        {emp.department}
                      </span>
                      <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg">A:{emp.annual_leaves}</span>
                      <span className="text-xs bg-rose-50   text-rose-700   px-2 py-0.5 rounded-lg">S:{emp.sick_leaves}</span>
                      <span className="text-xs bg-amber-50  text-amber-700  px-2 py-0.5 rounded-lg">C:{emp.casual_leaves}</span>
                    </div>
                    {user?.role === 'admin' && emp.id !== user?.id && (
                      <select
                        value={emp.role}
                        onChange={e => handleRoleChange(emp.id, e.target.value)}
                        disabled={updatingId === emp.id}
                        className="mt-2 text-xs border border-gray-200 rounded-lg px-2 py-1.5
                                   focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        {['employee', 'manager', 'admin'].map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
