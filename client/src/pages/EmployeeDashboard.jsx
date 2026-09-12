import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceService, leaveService } from '../services/api';
import {
  formatDate,
  formatTime,
  formatWorkingHours,
  getGreeting,
  getErrorMessage,
  getStatusBadgeClass,
} from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

const StatCard = ({ title, value, subtitle, color, icon }) => (
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

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [todayRes, attendanceRes, balanceRes] = await Promise.all([
        attendanceService.getTodayAttendance(),
        attendanceService.getMyAttendance({ limit: 7 }),
        leaveService.getLeaveBalance(),
      ]);
      setTodayAttendance(todayRes.data.attendance);
      setRecentAttendance(attendanceRes.data.records || []);
      setLeaveBalance(balanceRes.data.leaveBalance);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCheckIn = async () => {
    setActionLoading('checkin');
    setError('');
    setSuccess('');
    try {
      await attendanceService.checkIn();
      setSuccess('Checked in successfully!');
      await fetchData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading('');
    }
  };

  const handleCheckOut = async () => {
    setActionLoading('checkout');
    setError('');
    setSuccess('');
    try {
      await attendanceService.checkOut();
      setSuccess('Checked out successfully!');
      await fetchData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading('');
    }
  };

  // Monthly stats from recent records
  const thisMonth = recentAttendance.filter((r) => {
    const d = new Date(r.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const presentDays = thisMonth.filter((r) => ['present', 'late'].includes(r.status)).length;
  const totalWorkingMinutes = thisMonth.reduce((sum, r) => sum + (r.workingMinutes || 0), 0);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">
          {getGreeting()}, {user?.firstName}! 👋
        </h1>
        <p className="page-subtitle">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Today's Attendance Card */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Today's Attendance</h2>
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-xs text-gray-500 mb-1">Check In</p>
                <p className="text-base font-semibold text-gray-900">
                  {todayAttendance?.checkIn ? formatTime(todayAttendance.checkIn) : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Check Out</p>
                <p className="text-base font-semibold text-gray-900">
                  {todayAttendance?.checkOut ? formatTime(todayAttendance.checkOut) : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Working Hours</p>
                <p className="text-base font-semibold text-gray-900">
                  {todayAttendance?.workingMinutes
                    ? formatWorkingHours(todayAttendance.workingMinutes)
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>
                {todayAttendance ? (
                  <span className={getStatusBadgeClass(todayAttendance.status)}>
                    {todayAttendance.status.replace('-', ' ')}
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">Not checked in</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCheckIn}
              disabled={!!todayAttendance?.checkIn || actionLoading === 'checkin'}
              className="btn-success flex items-center gap-2 px-5"
            >
              {actionLoading === 'checkin' ? (
                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              )}
              Check In
            </button>
            <button
              onClick={handleCheckOut}
              disabled={!todayAttendance?.checkIn || !!todayAttendance?.checkOut || actionLoading === 'checkout'}
              className="btn-danger flex items-center gap-2 px-5"
            >
              {actionLoading === 'checkout' ? (
                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              )}
              Check Out
            </button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Leave Balance"
          value={`${leaveBalance ?? '—'} days`}
          subtitle="Annual leave remaining"
          color="bg-indigo-50"
          icon={
            <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          title="Days Present (7 days)"
          value={presentDays}
          subtitle="Out of last 7 attendance records"
          color="bg-green-50"
          icon={
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Total Hours (7 days)"
          value={formatWorkingHours(totalWorkingMinutes)}
          subtitle="Cumulative working hours"
          color="bg-blue-50"
          icon={
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Recent Attendance Table */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Attendance</h2>
        {recentAttendance.length === 0 ? (
          <p className="text-gray-500 text-sm py-4 text-center">No attendance records yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className="pb-3 text-gray-500 font-medium">Date</th>
                  <th className="pb-3 text-gray-500 font-medium">Check In</th>
                  <th className="pb-3 text-gray-500 font-medium">Check Out</th>
                  <th className="pb-3 text-gray-500 font-medium">Hours</th>
                  <th className="pb-3 text-gray-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentAttendance.map((record) => (
                  <tr key={record._id} className="table-row">
                    <td className="py-3 font-medium text-gray-900">{formatDate(record.date)}</td>
                    <td className="py-3 text-gray-600">{formatTime(record.checkIn)}</td>
                    <td className="py-3 text-gray-600">{formatTime(record.checkOut)}</td>
                    <td className="py-3 text-gray-600">{formatWorkingHours(record.workingMinutes)}</td>
                    <td className="py-3">
                      <span className={getStatusBadgeClass(record.status)}>
                        {record.status.replace('-', ' ')}
                      </span>
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

export default EmployeeDashboard;
