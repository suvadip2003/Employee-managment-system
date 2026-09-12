import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceService, leaveService } from '../services/api';
import { formatDate, formatWorkingHours, getErrorMessage } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

const InfoItem = ({ label, value }) => (
  <div>
    <dt className="text-xs font-medium text-gray-500">{label}</dt>
    <dd className="mt-1 text-sm text-gray-900 font-medium">{value || '—'}</dd>
  </div>
);

const Profile = () => {
  const { user } = useAuth();
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!user || user.role === 'hr') {
        setLoading(false);
        return;
      }
      try {
        const [attendanceRes, balanceRes] = await Promise.all([
          attendanceService.getMyAttendance({ limit: 30 }),
          leaveService.getLeaveBalance(),
        ]);

        const records = attendanceRes.data.records || [];
        const now = new Date();
        const monthRecords = records.filter((r) => {
          const d = new Date(r.date);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });

        const presentDays = monthRecords.filter((r) =>
          ['present', 'late'].includes(r.status)
        ).length;
        const totalWorkingMinutes = monthRecords.reduce(
          (sum, r) => sum + (r.workingMinutes || 0), 0
        );
        const lateDays = monthRecords.filter((r) => r.status === 'late').length;

        setAttendanceSummary({ presentDays, totalWorkingMinutes, lateDays });
        setLeaveBalance(balanceRes.data.leaveBalance);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) return <LoadingSpinner />;

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : '?';

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Your account information</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Profile Header Card */}
      <div className="card mb-5">
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {initials}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-gray-500 mt-0.5">{user?.position || 'No position set'}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user?.role === 'hr'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-indigo-100 text-indigo-800'
              }`}>
                {user?.role === 'hr' ? 'HR Manager' : 'Employee'}
              </span>
              {user?.employeeId && (
                <span className="text-xs text-gray-400 font-mono">{user.employeeId}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="card mb-5">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Personal Information</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <InfoItem label="First Name" value={user?.firstName} />
          <InfoItem label="Last Name" value={user?.lastName} />
          <InfoItem label="Email Address" value={user?.email} />
          <InfoItem label="Phone" value={user?.phone} />
          <InfoItem label="Department" value={user?.department} />
          <InfoItem label="Position" value={user?.position} />
          <InfoItem
            label="Join Date"
            value={user?.joinDate ? formatDate(user.joinDate) : '—'}
          />
          <InfoItem
            label="Account Status"
            value={user?.isActive !== false ? 'Active' : 'Inactive'}
          />
        </dl>
      </div>

      {/* Employee Stats (not for HR) */}
      {user?.role === 'employee' && (
        <>
          <div className="card mb-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">This Month's Summary</h3>
            {attendanceSummary ? (
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <div className="text-3xl font-bold text-green-600">
                    {attendanceSummary.presentDays}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Days Present</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-xl">
                  <div className="text-3xl font-bold text-orange-600">
                    {attendanceSummary.lateDays}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Late Arrivals</div>
                </div>
                <div className="text-center p-4 bg-indigo-50 rounded-xl">
                  <div className="text-3xl font-bold text-indigo-600">
                    {formatWorkingHours(attendanceSummary.totalWorkingMinutes)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Total Hours</div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No attendance data for this month.</p>
            )}
          </div>

          <div className="card">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Leave Balance</h3>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full border-4 border-indigo-200 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-indigo-600">{leaveBalance ?? '—'}</span>
              </div>
              <div>
                <p className="text-gray-700 font-medium">
                  {leaveBalance} days of annual leave remaining
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Resets annually. Contact HR to update your balance.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* HR-specific info */}
      {user?.role === 'hr' && (
        <div className="card">
          <h3 className="text-base font-semibold text-gray-900 mb-2">HR Permissions</h3>
          <p className="text-sm text-gray-500 mb-3">As HR, you have access to:</p>
          <ul className="space-y-2 text-sm text-gray-600">
            {[
              'View and manage all employee profiles',
              'Review and approve/reject leave requests',
              'Monitor attendance records for all employees',
              'Update employee department, position, and leave balance',
              'Access company-wide attendance statistics',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <svg className="h-4 w-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Profile;
