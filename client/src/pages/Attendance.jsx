import React, { useState, useEffect, useCallback } from 'react';
import { attendanceService } from '../services/api';
import {
  formatDate,
  formatTime,
  formatWorkingHours,
  getStatusBadgeClass,
  getErrorMessage,
  getTodayString,
} from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

const Attendance = () => {
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    page: 1,
    limit: 15,
  });

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page: filters.page, limit: filters.limit };
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const res = await attendanceService.getMyAttendance(params);
      setRecords(res.data.records || []);
      setPagination(res.data.pagination || {});
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({ startDate: '', endDate: '', page: 1, limit: 15 });
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  // Summary counts
  const presentCount = records.filter((r) => r.status === 'present').length;
  const lateCount = records.filter((r) => r.status === 'late').length;
  const absentCount = records.filter((r) => r.status === 'absent').length;
  const halfDayCount = records.filter((r) => r.status === 'half-day').length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">My Attendance</h1>
        <p className="page-subtitle">View and filter your attendance history</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Present', count: presentCount, cls: 'bg-green-50 text-green-700 border-green-200' },
          { label: 'Late', count: lateCount, cls: 'bg-orange-50 text-orange-700 border-orange-200' },
          { label: 'Half Day', count: halfDayCount, cls: 'bg-blue-50 text-blue-700 border-blue-200' },
          { label: 'Absent', count: absentCount, cls: 'bg-red-50 text-red-700 border-red-200' },
        ].map((item) => (
          <div key={item.label} className={`rounded-lg border p-3 text-center ${item.cls}`}>
            <div className="text-2xl font-bold">{item.count}</div>
            <div className="text-xs font-medium mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card mb-5">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              max={getTodayString()}
              onChange={handleFilterChange}
              className="input-field text-sm py-1.5 w-40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              max={getTodayString()}
              onChange={handleFilterChange}
              className="input-field text-sm py-1.5 w-40"
            />
          </div>
          {(filters.startDate || filters.endDate) && (
            <button
              onClick={handleClearFilters}
              className="btn-secondary text-sm py-1.5"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <LoadingSpinner />
        ) : records.length === 0 ? (
          <div className="text-center py-12">
            <svg className="h-12 w-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500 text-sm">No attendance records found for the selected period.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className="pb-3 text-gray-500 font-medium">Date</th>
                    <th className="pb-3 text-gray-500 font-medium">Check In</th>
                    <th className="pb-3 text-gray-500 font-medium">Check Out</th>
                    <th className="pb-3 text-gray-500 font-medium">Working Hours</th>
                    <th className="pb-3 text-gray-500 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {records.map((record) => (
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

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Showing {((pagination.page - 1) * pagination.limit) + 1}–
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} records
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                    className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Attendance;
