import React, { useState, useEffect, useCallback } from 'react';
import { hrService } from '../services/api';
import { formatDate, getErrorMessage } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

const EmployeeDirectory = () => {
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [editEmployee, setEditEmployee] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [detailEmployee, setDetailEmployee] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;

      const res = await hrService.getEmployees(params);
      setEmployees(res.data.employees || []);
      setPagination(res.data.pagination || {});
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const openEdit = (emp) => {
    setEditEmployee(emp);
    setEditForm({
      department: emp.department || '',
      position: emp.position || '',
      leaveBalance: emp.leaveBalance ?? 20,
      phone: emp.phone || '',
      isActive: emp.isActive,
    });
    setSuccess('');
    setError('');
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setError('');
    try {
      await hrService.updateEmployee(editEmployee._id, {
        ...editForm,
        leaveBalance: Number(editForm.leaveBalance),
      });
      setSuccess(`${editEmployee.firstName} ${editEmployee.lastName} updated successfully.`);
      setEditEmployee(null);
      await fetchEmployees();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setEditLoading(false);
    }
  };

  const openDetail = async (emp) => {
    setDetailEmployee(emp);
    setDetailLoading(true);
    try {
      const res = await hrService.getEmployee(emp._id);
      setDetailData(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">Employee Directory</h1>
        <p className="page-subtitle">View and manage all employees</p>
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

      {/* Search */}
      <div className="card mb-5">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, email, department, or employee ID..."
            className="input-field pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <LoadingSpinner />
        ) : employees.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">
              {search ? `No employees found matching "${search}"` : 'No employees found.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className="pb-3 text-gray-500 font-medium">Employee</th>
                    <th className="pb-3 text-gray-500 font-medium">ID</th>
                    <th className="pb-3 text-gray-500 font-medium">Department</th>
                    <th className="pb-3 text-gray-500 font-medium">Position</th>
                    <th className="pb-3 text-gray-500 font-medium">Join Date</th>
                    <th className="pb-3 text-gray-500 font-medium">Leave Balance</th>
                    <th className="pb-3 text-gray-500 font-medium">Status</th>
                    <th className="pb-3 text-gray-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {employees.map((emp) => (
                    <tr key={emp._id} className="table-row">
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 text-xs font-semibold flex-shrink-0">
                            {emp.firstName?.[0]}{emp.lastName?.[0]}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {emp.firstName} {emp.lastName}
                            </div>
                            <div className="text-xs text-gray-400">{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-gray-500 font-mono text-xs">{emp.employeeId || '—'}</td>
                      <td className="py-3 text-gray-600">{emp.department || '—'}</td>
                      <td className="py-3 text-gray-600">{emp.position || '—'}</td>
                      <td className="py-3 text-gray-500">{formatDate(emp.joinDate)}</td>
                      <td className="py-3 text-gray-600">{emp.leaveBalance} days</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          emp.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {emp.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => openDetail(emp)}
                            className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs hover:bg-indigo-200 transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => openEdit(emp)}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">{pagination.total} employees total</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page === 1}
                    className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <span className="flex items-center text-sm text-gray-500">{page} / {pagination.pages}</span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= pagination.pages}
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

      {/* Edit Modal */}
      {editEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Edit {editEmployee.firstName} {editEmployee.lastName}
              </h2>
              <button
                onClick={() => setEditEmployee(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
                <input
                  name="department"
                  value={editForm.department}
                  onChange={handleEditChange}
                  className="input-field"
                  placeholder="e.g. Engineering"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Position</label>
                <input
                  name="position"
                  value={editForm.position}
                  onChange={handleEditChange}
                  className="input-field"
                  placeholder="e.g. Software Developer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                <input
                  name="phone"
                  value={editForm.phone}
                  onChange={handleEditChange}
                  className="input-field"
                  placeholder="+1-555-0101"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Leave Balance (days)</label>
                <input
                  name="leaveBalance"
                  type="number"
                  min="0"
                  max="60"
                  value={editForm.leaveBalance}
                  onChange={handleEditChange}
                  className="input-field"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="isActive"
                  name="isActive"
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={handleEditChange}
                  className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Active Employee
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={editLoading}
                  className="btn-primary flex items-center gap-2"
                >
                  {editLoading ? (
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : null}
                  Save Changes
                </button>
                <button type="button" onClick={() => setEditEmployee(null)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {detailEmployee.firstName} {detailEmployee.lastName}
              </h2>
              <button
                onClick={() => { setDetailEmployee(null); setDetailData(null); }}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {detailLoading ? (
                <LoadingSpinner />
              ) : detailData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400 text-xs">Email</p>
                      <p className="font-medium text-gray-900">{detailData.employee.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Employee ID</p>
                      <p className="font-medium text-gray-900">{detailData.employee.employeeId || '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Department</p>
                      <p className="font-medium text-gray-900">{detailData.employee.department || '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Position</p>
                      <p className="font-medium text-gray-900">{detailData.employee.position || '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Phone</p>
                      <p className="font-medium text-gray-900">{detailData.employee.phone || '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Join Date</p>
                      <p className="font-medium text-gray-900">{formatDate(detailData.employee.joinDate)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Leave Balance</p>
                      <p className="font-medium text-gray-900">{detailData.employee.leaveBalance} days</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Status</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        detailData.employee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {detailData.employee.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {detailData.attendanceSummary && (
                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-500 mb-3">This Month's Attendance</p>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: 'Present', value: detailData.attendanceSummary.presentDays, color: 'text-green-600' },
                          { label: 'Late', value: detailData.attendanceSummary.lateDays, color: 'text-orange-600' },
                          { label: 'Half Day', value: detailData.attendanceSummary.halfDays, color: 'text-blue-600' },
                          { label: 'Hours', value: `${detailData.attendanceSummary.totalWorkingHours}h`, color: 'text-indigo-600' },
                        ].map((stat) => (
                          <div key={stat.label} className="bg-gray-50 rounded-lg p-2 text-center">
                            <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                            <div className="text-xs text-gray-400">{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDirectory;
