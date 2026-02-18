'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { Institution } from '@/lib/types';
import { getInstitutions, createInstitution, updateInstitution, deleteInstitution } from '@/lib/api';
import { Building2, Plus, Edit, Trash2, Search } from 'lucide-react';

export default function ManageInstitutions() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [filteredInstitutions, setFilteredInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState<Institution | null>(null);
  const [newCollegeName, setNewCollegeName] = useState('');
  const [editingCollegeIndex, setEditingCollegeIndex] = useState<number | null>(null);
  const [editingCollegeText, setEditingCollegeText] = useState('');

  const [formData, setFormData] = useState<{
    name: string;
    type: 'school' | 'college' | 'university' | 'ngo';
    address: string;
    contact_email: string;
    contact_phone: string;
    colleges: string[];
  }>({
    name: '',
    type: 'school',
    address: '',
    contact_email: '',
    contact_phone: '',
    colleges: []
  });

  useEffect(() => {
    loadInstitutions();
  }, []);

  useEffect(() => {
    filterInstitutions();
  }, [institutions, searchTerm]);

  const loadInstitutions = async () => {
    try {
      const data = await getInstitutions();
      // Ensure id exists (fallback to _id)
      const normalizedData = data.map((inst: any) => ({
        ...inst,
        id: inst.id || inst._id,
        colleges: inst.colleges || []
      }));
      setInstitutions(normalizedData);
    } catch (error) {
      console.error('Error loading institutions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterInstitutions = () => {
    let filtered = institutions;

    if (searchTerm) {
      filtered = filtered.filter(inst =>
        inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inst.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredInstitutions(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let data;
      // Ensure colleges are only sent for universities
      const submitData = {
        ...formData,
        colleges: formData.type === 'university' ? formData.colleges : []
      };

      if (editingInstitution) {
        data = await updateInstitution(editingInstitution.id, submitData);
        const normalized = { ...data, id: data.id || data._id, colleges: data.colleges || [] };
        setInstitutions(institutions.map(inst =>
          inst.id === editingInstitution.id ? normalized : inst
        ));
      } else {
        data = await createInstitution(submitData);
        const normalized = { ...data, id: data.id || data._id, colleges: data.colleges || [] };
        setInstitutions([...institutions, normalized]);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving institution:', error);
    }
  };

  const deleteInstitutionHandler = async (institutionId: string) => {
    if (!confirm('Are you sure you want to delete this institution?')) return;

    try {
      await deleteInstitution(institutionId);
      setInstitutions(institutions.filter(inst => inst.id !== institutionId));
    } catch (error) {
      console.error('Error deleting institution:', error);
    }
  };

  const startEdit = (institution: Institution) => {
    setEditingInstitution(institution);
    setFormData({
      name: institution.name,
      type: institution.type,
      address: institution.address || '',
      contact_email: institution.contact_email || '',
      contact_phone: institution.contact_phone || '',
      colleges: institution.colleges || []
    });
    setShowCreateForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'school',
      address: '',
      contact_email: '',
      contact_phone: '',
      colleges: []
    });
    setEditingInstitution(null);
    setShowCreateForm(false);
    setNewCollegeName('');
    setEditingCollegeIndex(null);
    setEditingCollegeText('');
  };

  const addCollege = () => {
    if (newCollegeName.trim()) {
      setFormData({
        ...formData,
        colleges: [...formData.colleges, newCollegeName.trim()]
      });
      setNewCollegeName('');
    }
  };

  const removeCollege = (index: number) => {
    const updatedColleges = [...formData.colleges];
    updatedColleges.splice(index, 1);
    setFormData({
      ...formData,
      colleges: updatedColleges
    });
  };

  const startEditingCollege = (index: number, name: string) => {
    setEditingCollegeIndex(index);
    setEditingCollegeText(name);
  };

  const saveEditedCollege = (index: number) => {
    if (editingCollegeText.trim()) {
      const updatedColleges = [...formData.colleges];
      updatedColleges[index] = editingCollegeText.trim();
      setFormData({
        ...formData,
        colleges: updatedColleges
      });
      setEditingCollegeIndex(null);
      setEditingCollegeText('');
    }
  };

  const cancelEditingCollege = () => {
    setEditingCollegeIndex(null);
    setEditingCollegeText('');
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
              <Building2 className="w-8 h-8 mr-3" />
              Manage Institutions
            </h1>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Institution
            </button>
          </div>

          {/* Create/Edit Form */}
          {showCreateForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingInstitution ? 'Edit Institution' : 'Create New Institution'}
              </h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="school">School</option>
                    <option value="college">College</option>
                    <option value="university">University</option>
                    <option value="ngo">NGO</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* College Management for University Type */}
                {formData.type === 'university' && (
                  <div className="md:col-span-2 border-t pt-4 mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Manage Colleges</label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        placeholder="Enter college name"
                        value={newCollegeName}
                        onChange={(e) => setNewCollegeName(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCollege())}
                      />
                      <button
                        type="button"
                        onClick={addCollege}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                      >
                        Add
                      </button>
                    </div>

                    {formData.colleges.length > 0 ? (
                      <ul className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-2 bg-gray-50">
                        {formData.colleges.map((college, index) => (
                          <li key={index} className="flex justify-between items-center bg-white p-2 rounded shadow-sm">
                            {editingCollegeIndex === index ? (
                              <div className="flex flex-1 items-center gap-2">
                                <input
                                  type="text"
                                  value={editingCollegeText}
                                  onChange={(e) => setEditingCollegeText(e.target.value)}
                                  className="flex-1 px-2 py-1 text-sm border border-indigo-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      saveEditedCollege(index);
                                    } else if (e.key === 'Escape') {
                                      cancelEditingCollege();
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => saveEditedCollege(index)}
                                  className="text-green-600 hover:text-green-800 text-xs font-semibold"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditingCollege}
                                  className="text-gray-500 hover:text-gray-700 text-xs"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="text-sm text-gray-800">{college}</span>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => startEditingCollege(index, college)}
                                    className="text-blue-500 hover:text-blue-700"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeCollege(index)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No colleges added yet.</p>
                    )}
                  </div>
                )}

                <div className="md:col-span-2 flex gap-4 mt-4">
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                  >
                    {editingInstitution ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Search */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search institutions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Institutions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInstitutions.map((institution) => (
              <div key={institution.id || institution._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{institution.name}</h3>
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full capitalize">
                      {institution.type}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(institution)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteInstitutionHandler(institution.id || institution._id!)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {institution.address && (
                  <p className="text-sm text-gray-600 mb-2">{institution.address}</p>
                )}
                {institution.contact_email && (
                  <p className="text-sm text-gray-600 mb-1">📧 {institution.contact_email}</p>
                )}
                {institution.contact_phone && (
                  <p className="text-sm text-gray-600 mb-2">📞 {institution.contact_phone}</p>
                )}

                {institution.type === 'university' && institution.colleges && institution.colleges.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Colleges ({institution.colleges.length}):</p>
                    <div className="flex flex-wrap gap-1">
                      {institution.colleges.slice(0, 3).map((col, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                          {col}
                        </span>
                      ))}
                      {institution.colleges.length > 3 && (
                        <span className="text-xs text-gray-500 px-1">+ {institution.colleges.length - 3} more</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredInstitutions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No institutions found.</p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}