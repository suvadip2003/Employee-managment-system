import React, { useState, useEffect, useCallback } from 'react';
import { leaveService } from '../services/api';
import {
  formatDate,
  getStatusBadgeClass,
  getErrorMessage,
  calculateDays,
  getTodayString,
} from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

const LeaveRequest = () => {
  const [leaves, setLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    leaveType: 'annual',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const fetchData = useCallback(async () => {
    try {
      const [leavesRes, balanceRes] = await Promise.all([
        leaveService.getMyLeaves(),
        leaveService.getLeaveBalance(),
      ]);
      setLeaves(leavesRes.data.leaves || []);
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

  const totalDays = calculateDays(form.startDate, form.endDate);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.startDate) errs.startDate = 'Start date is required';
    if (!form.endDate) errs.endDate = 'End date is required';
    else if (form.endDate < form.startDate) errs.endDate = 'End date must be after start date';
    if (!form.reason.trim()) errs.reason = 'Reason is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }
    setSubmitting(true);
    try {
      await leaveService.createLeave(form);
      setSuccess('Leave request submitted successfully!');
      setForm({ leaveType: 'annual', startDate: '', endDate: '', reason: '' });
      setShowForm(false);
      await fetchData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="page-header mb-0">
          <h1 className="page-title">Leave Requests</h1>
          <p className="page-subtitle">Manage your time off requests</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(''); setSuccess(''); }}
          className="btn-primary flex items-center gap-2"
        >
          {showForm ? (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Request
            </>
          )}
        </button>
      </div>

      {/* Leave Balance */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card text-center border-l-4 border-indigo-500">
          <p className="text-xs text-gray-500 mb-1">Leave Balance</p>
          <p className="text-3xl font-bold text-indigo-600">{leaveBalance ?? '—'}</p>
          <p className="text-xs text-gray-400">days remaining</p>
        </div>
        <div className="card text-center border-l-4 border-green-500">
          <p className="text-xs text-gray-500 mb-1">Approved Leaves</p>
          <p className="text-3xl font-bold text-green-600">
            {leaves.filter((l) => l.status === 'approved').length}
          </p>
          <p className="text-xs text-gray-400">this year</p>
        </div>
        <div className="card text-center border-l-4 border-yellow-500">
          <p className="text-xs text-gray-500 mb-1">Pending Requests</p>
          <p className="text-3xl font-bold text-yellow-600">
            {leaves.filter((l) => l.status === 'pending').length}
          </p>
          <p className="text-xs text-gray-400">awaiting approval</p>
        </div>
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

      {/* New Leave Form */}
      {showForm && (
        <div className="card mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">New Leave Request</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Leave Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="leaveType"
                  value={form.leaveType}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="annual">Annual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="personal">Personal Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
              </div>
              <div className="flex items-end">
                {form.startDate && form.endDate && totalDays > 0 && (
                  <div className="w-full p-3 bg-indigo-50 rounded-lg text-center">
                    <p className="text-xs text-indigo-600">Total Days Requested</p>
                    <p className="text-2xl font-bold text-indigo-700">{totalDays}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  min={getTodayString()}
                  onChange={handleChange}
                  className={`input-field ${formErrors.startDate ? 'border-red-400' : ''}`}
                />
                {formErrors.startDate && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.startDate}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  min={form.startDate || getTodayString()}
                  onChange={handleChange}
                  className={`input-field ${formErrors.endDate ? 'border-red-400' : ''}`}
                />
                {formErrors.endDate && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.endDate}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                name="reason"
                value={form.reason}
                onChange={handleChange}
                rows={3}
                placeholder="Please provide a reason for your leave request..."
                className={`input-field resize-none ${formErrors.reason ? 'border-red-400' : ''}`}
              />
              {formErrors.reason && (
                <p className="mt-1 text-xs text-red-600">{formErrors.reason}</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Leave List */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 mb-4">My Leave Requests</h2>
        {leaves.length === 0 ? (
          <div className="text-center py-10">
            <svg className="h-12 w-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 text-sm">No leave requests yet.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-indigo-600 text-sm hover:underline"
            >
              Submit your first request
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {leaves.map((leave) => (
              <div
                key={leave._id}
                className={`border rounded-lg p-4 ${
                  leave.status === 'approved'
                    ? 'border-green-200 bg-green-50'
                    : leave.status === 'rejected'
                    ? 'border-red-200 bg-red-50'
                    : 'border-yellow-200 bg-yellow-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 capitalize">
                        {leave.leaveType} Leave
                      </span>
                      <span className={getStatusBadgeClass(leave.status)}>{leave.status}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {formatDate(leave.startDate)} – {formatDate(leave.endDate)}
                      <span className="ml-2 text-gray-400">({leave.totalDays} {leave.totalDays === 1 ? 'day' : 'days'})</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-1">{leave.reason}</p>
                    {leave.reviewNotes && (
                      <p className="text-xs text-gray-400 mt-1 italic">
                        HR note: {leave.reviewNotes}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-xs text-gray-400 flex-shrink-0">
                    <div>Applied: {formatDate(leave.createdAt)}</div>
                    {leave.reviewedAt && (
                      <div className="mt-1">Reviewed: {formatDate(leave.reviewedAt)}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveRequest;
