import React, { useState, useEffect, useCallback } from 'react';
import { hrService } from '../services/api';
import {
  formatDate,
  getStatusBadgeClass,
  getErrorMessage,
} from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

const LeaveManagement = () => {
  const [leaves, setLeaves] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewNotes, setReviewNotes] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    leaveType: '',
    page: 1,
    limit: 15,
  });

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page: filters.page, limit: filters.limit };
      if (filters.status) params.status = filters.status;
      if (filters.leaveType) params.leaveType = filters.leaveType;

      const res = await hrService.getAllLeaves(params);
      setLeaves(res.data.leaves || []);
      setPagination(res.data.pagination || {});
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const handleReview = async (id, status) => {
    setReviewingId(id);
    setError('');
    setSuccess('');
    try {
      await hrService.reviewLeave(id, {
        status,
        reviewNotes: reviewNotes[id] || '',
      });
      setSuccess(`Leave request ${status} successfully.`);
      setExpandedId(null);
      setReviewNotes((prev) => ({ ...prev, [id]: '' }));
      await fetchLeaves();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">Leave Management</h1>
        <p className="page-subtitle">Review and manage employee leave requests</p>
      </div>

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

      {/* Filters */}
      <div className="card mb-5">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="input-field text-sm py-1.5 w-36"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Leave Type</label>
            <select
              name="leaveType"
              value={filters.leaveType}
              onChange={handleFilterChange}
              className="input-field text-sm py-1.5 w-40"
            >
              <option value="">All Types</option>
              <option value="annual">Annual</option>
              <option value="sick">Sick</option>
              <option value="personal">Personal</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
          {(filters.status || filters.leaveType) && (
            <div className="flex items-end">
              <button
                onClick={() => setFilters((prev) => ({ ...prev, status: '', leaveType: '', page: 1 }))}
                className="btn-secondary text-sm py-1.5"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <LoadingSpinner />
        ) : leaves.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">No leave requests found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className="pb-3 text-gray-500 font-medium">Employee</th>
                    <th className="pb-3 text-gray-500 font-medium">Type</th>
                    <th className="pb-3 text-gray-500 font-medium">Period</th>
                    <th className="pb-3 text-gray-500 font-medium">Days</th>
                    <th className="pb-3 text-gray-500 font-medium">Status</th>
                    <th className="pb-3 text-gray-500 font-medium">Applied</th>
                    <th className="pb-3 text-gray-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {leaves.map((leave) => (
                    <React.Fragment key={leave._id}>
                      <tr
                        className="table-row cursor-pointer"
                        onClick={() => setExpandedId(expandedId === leave._id ? null : leave._id)}
                      >
                        <td className="py-3">
                          <div className="font-medium text-gray-900">
                            {leave.employee?.firstName} {leave.employee?.lastName}
                          </div>
                          <div className="text-xs text-gray-400">{leave.employee?.department}</div>
                        </td>
                        <td className="py-3 capitalize text-gray-600">{leave.leaveType}</td>
                        <td className="py-3 text-gray-600 whitespace-nowrap">
                          {formatDate(leave.startDate)} – {formatDate(leave.endDate)}
                        </td>
                        <td className="py-3 text-gray-600">{leave.totalDays}</td>
                        <td className="py-3">
                          <span className={getStatusBadgeClass(leave.status)}>{leave.status}</span>
                        </td>
                        <td className="py-3 text-gray-500 whitespace-nowrap">{formatDate(leave.createdAt)}</td>
                        <td className="py-3" onClick={(e) => e.stopPropagation()}>
                          {leave.status === 'pending' && (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleReview(leave._id, 'approved')}
                                disabled={reviewingId === leave._id}
                                className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors disabled:opacity-50"
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => handleReview(leave._id, 'rejected')}
                                disabled={reviewingId === leave._id}
                                className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors disabled:opacity-50"
                              >
                                ✕ Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>

                      {/* Expanded Row */}
                      {expandedId === leave._id && (
                        <tr>
                          <td colSpan={7} className="pb-3 px-4">
                            <div className="bg-gray-50 rounded-lg p-4 text-sm">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                                <div>
                                  <p className="text-xs font-medium text-gray-500 mb-1">Reason</p>
                                  <p className="text-gray-700">{leave.reason}</p>
                                </div>
                                {leave.reviewNotes && (
                                  <div>
                                    <p className="text-xs font-medium text-gray-500 mb-1">Review Notes</p>
                                    <p className="text-gray-700 italic">{leave.reviewNotes}</p>
                                  </div>
                                )}
                              </div>

                              {leave.status === 'pending' && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">
                                    Add Review Notes (optional)
                                  </label>
                                  <textarea
                                    value={reviewNotes[leave._id] || ''}
                                    onChange={(e) =>
                                      setReviewNotes((prev) => ({ ...prev, [leave._id]: e.target.value }))
                                    }
                                    rows={2}
                                    placeholder="Add a note for the employee..."
                                    className="input-field text-sm resize-none"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <div className="flex gap-2 mt-2">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleReview(leave._id, 'approved'); }}
                                      disabled={reviewingId === leave._id}
                                      className="btn-success text-sm py-1.5"
                                    >
                                      Approve Request
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleReview(leave._id, 'rejected'); }}
                                      disabled={reviewingId === leave._id}
                                      className="btn-danger text-sm py-1.5"
                                    >
                                      Reject Request
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  {pagination.total} total requests
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
                    disabled={filters.page === 1}
                    className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <span className="flex items-center text-sm text-gray-500">
                    {filters.page} / {pagination.pages}
                  </span>
                  <button
                    onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
                    disabled={filters.page >= pagination.pages}
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

export default LeaveManagement;
