'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/lib/types';
import { getAdminUsers, updateUserRole, deleteUser, updateUserSubjects } from '@/lib/api';
import { Users, Edit, Trash2, Search, Filter, BookOpen, X } from 'lucide-react';
import Button from '@/components/Button';

export default function ManageUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Subject Modal State
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<User | null>(null);
  const [subjectInput, setSubjectInput] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadUsers();
    }
  }, [user]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const loadUsers = async () => {
    if (!user || user.role !== 'admin') return;
    try {
      const data = await getAdminUsers();
      if (data) setUsers(data);
    } catch (error: any) {
      console.error('Error loading users:', error);
      if (error.message === 'Access denied' || error.status === 403) {
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const deleteUserHandler = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await deleteUser(userId);
      setUsers(users.filter(u => (u._id || u.id) !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const updateUserRoleHandler = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers(users.map(u => (u._id || u.id) === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const openSubjectModal = (user: User) => {
    setSelectedTeacher(user);
    setSubjectInput(user.assigned_subjects?.join(', ') || '');
    setShowSubjectModal(true);
  };

  const handleSaveSubjects = async () => {
    if (!selectedTeacher) return;

    // Validate input
    const subjects = subjectInput.split(',').map(s => s.trim()).filter(s => s.length > 0);
    if (subjects.length === 0) {
      alert('At least one subject is required.');
      return;
    }

    setSaveLoading(true);
    try {
      await updateUserSubjects(selectedTeacher._id || selectedTeacher.id, subjects);

      // Update local state
      setUsers(users.map(u => (u._id || u.id) === selectedTeacher._id ? { ...u, assigned_subjects: subjects } : u));
      setShowSubjectModal(false);
      setSelectedTeacher(null);
    } catch (error) {
      console.error('Error updating subjects:', error);
      alert('Failed to update subjects');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Users className="w-8 h-8 mr-3" />
              Manage Users
            </h1>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="teacher">Teachers</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Institution</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user._id || user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.role === 'teacher' && user.assigned_subjects && user.assigned_subjects.length > 0 && (
                            <div className="text-xs text-green-600 mt-1">
                              Subjects: {user.assigned_subjects.join(', ')}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRoleHandler(user._id || user.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-green-500"
                        >
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.institution_id || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at || Date.now()).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          {user.role === 'teacher' && (
                            <button
                              onClick={() => openSubjectModal(user)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Manage Subjects"
                            >
                              <BookOpen className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteUserHandler(user._id || user.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No users found matching your criteria.</p>
            </div>
          )}
        </div>

        {/* Manage Subjects Modal */}
        {showSubjectModal && selectedTeacher && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full m-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Manage Subjects</h2>
                <button onClick={() => setShowSubjectModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Teacher: <strong>{selectedTeacher.full_name}</strong></p>
                <label className="block text-sm font-medium mb-1">Assigned Subjects (comma separated)</label>
                <input
                  type="text"
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Mathematics, Physics, Chemistry"
                />
                <p className="text-xs text-gray-500 mt-1">Existing subjects: {selectedTeacher.assigned_subjects?.join(', ') || 'None'}</p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowSubjectModal(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleSaveSubjects} disabled={saveLoading}>
                  {saveLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}