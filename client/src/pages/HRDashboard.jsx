import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';
import { hrService } from '../services/api';
import { formatDate, getErrorMessage, getStatusBadgeClass } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

const StatCard = ({ title, value, color, icon, subtitle }) => (
  <div className="card flex items-center gap-4">
    <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

const PIE_COLORS = { pending: '#F59E0B', approved: '#10B981', rejected: '#EF4444' };

const HRDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [leavePieData, setLeavePieData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewingId, setReviewingId] = useState(null);

  const fetchData = async () => {
    try {
      const [statsRes, leavesRes] = await Promise.all([
        hrService.getAttendanceStats(),
        hrService.getAllLeaves({ limit: 5 }),
      ]);
      setStats(statsRes.data);
      setRecentLeaves(leavesRes.data.leaves || []);

      // Build pie data from all leaves
      const allLeavesRes = await hrService.getAllLeaves({ limit: 200 });
      const allLeaves = allLeavesRes.data.leaves || [];
      const counts = { pending: 0, approved: 0, rejected: 0 };
      allLeaves.forEach((l) => { counts[l.status] = (counts[l.status] || 0) + 1; });
      setLeavePieData(
        Object.entries(counts)
          .filter(([, v]) => v > 0)
          .map(([name, value]) => ({ name, value }))
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReview = async (id, status) => {
    setReviewingId(id);
    try {
      await hrService.reviewLeave(id, { status });
      await fetchData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setReviewingId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">HR Dashboard</h1>
        <p className="page-subtitle">Overview of employee attendance and leave management</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          title="Total Employees"
          value={stats?.totalEmployees ?? '—'}
          color="bg-indigo-50"
          icon={
            <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          title="Present Today"
          value={stats?.presentToday ?? '—'}
          color="bg-green-50"
          icon={
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Absent Today"
          value={stats?.absentToday ?? '—'}
          color="bg-red-50"
          icon={
            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Late Today"
          value={stats?.lateToday ?? '—'}
          color="bg-orange-50"
          icon={
            <svg className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Pending Leaves"
          value={stats?.pendingLeaves ?? '—'}
          color="bg-yellow-50"
          subtitle="Awaiting review"
          icon={
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Bar Chart - last 7 days */}
        <div className="card lg:col-span-2">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Attendance — Last 7 Days</h2>
          {stats?.last7Days?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.last7Days} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" name="Present" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" name="Absent" fill="#f87171" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
              No data available
            </div>
          )}
        </div>

        {/* Pie Chart - leave status */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Leave Requests</h2>
          {leavePieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={leavePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {leavePieData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={PIE_COLORS[entry.name] || '#6366f1'}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {leavePieData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: PIE_COLORS[entry.name] }}
                    />
                    {entry.name} ({entry.value})
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-gray-400 text-sm">
              No leave data
            </div>
          )}
        </div>
      </div>

      {/* Recent Leave Requests */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Leave Requests</h2>
        {recentLeaves.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-6">No leave requests found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className="pb-3 text-gray-500 font-medium">Employee</th>
                  <th className="pb-3 text-gray-500 font-medium">Type</th>
                  <th className="pb-3 text-gray-500 font-medium">Dates</th>
                  <th className="pb-3 text-gray-500 font-medium">Days</th>
                  <th className="pb-3 text-gray-500 font-medium">Status</th>
                  <th className="pb-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentLeaves.map((leave) => (
                  <tr key={leave._id} className="table-row">
                    <td className="py-3">
                      <div className="font-medium text-gray-900">
                        {leave.employee?.firstName} {leave.employee?.lastName}
                      </div>
                      <div className="text-xs text-gray-400">{leave.employee?.department}</div>
                    </td>
                    <td className="py-3 capitalize text-gray-600">{leave.leaveType}</td>
                    <td className="py-3 text-gray-600">
                      {formatDate(leave.startDate)} – {formatDate(leave.endDate)}
                    </td>
                    <td className="py-3 text-gray-600">{leave.totalDays}</td>
                    <td className="py-3">
                      <span className={getStatusBadgeClass(leave.status)}>{leave.status}</span>
                    </td>
                    <td className="py-3">
                      {leave.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReview(leave._id, 'approved')}
                            disabled={reviewingId === leave._id}
                            className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReview(leave._id, 'rejected')}
                            disabled={reviewingId === leave._id}
                            className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HRDashboard;
