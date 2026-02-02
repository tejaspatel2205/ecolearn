'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/lib/types';
import { getAdminUsers, updateUserSubjects } from '@/lib/api';
import { BookOpen, Plus, X, Search, Save, Loader2 } from 'lucide-react';
import Button from '@/components/Button';

export default function AssignSubjectsPage() {
    const { user } = useAuth();
    const [teachers, setTeachers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // State for managing edits
    // Map of userId -> new subject string input
    const [inputs, setInputs] = useState<Record<string, string>>({});
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        if (user && user.role === 'admin') {
            loadTeachers();
        }
    }, [user]);

    const loadTeachers = async () => {
        try {
            const data = await getAdminUsers();
            if (data) {
                // Filter only teachers
                setTeachers(data.filter((u: User) => u.role === 'teacher'));
            }
        } catch (error) {
            console.error('Error loading teachers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveSubject = async (teacher: User, subjectToRemove: string) => {
        if (!teacher.assigned_subjects) return;

        // Optimistic update
        const previousSubjects = [...teacher.assigned_subjects];
        const newSubjects = teacher.assigned_subjects.filter(s => s !== subjectToRemove);

        // Prevent removing the last subject? Requirement said "at least one subject".
        if (newSubjects.length === 0) {
            alert("A teacher must have at least one assigned subject.");
            return;
        }

        // Update local state immediately
        updateTeacherLocal(teacher._id || teacher.id, newSubjects);
        setActionLoading(teacher._id || teacher.id);

        try {
            await updateUserSubjects(teacher._id || teacher.id, newSubjects);
        } catch (error) {
            console.error("Failed to remove subject", error);
            alert("Failed to remove subject");
            // Revert
            updateTeacherLocal(teacher._id || teacher.id, previousSubjects);
        } finally {
            setActionLoading(null);
        }
    };

    const handleAddSubject = async (teacher: User) => {
        const teacherId = teacher._id || teacher.id;
        const inputVal = inputs[teacherId];

        if (!inputVal || !inputVal.trim()) return;

        const semester = inputs[`${teacherId}_sem`] || '1';
        const newSubjectsToAdd = inputVal.split(',').map(s => {
            const rawSubject = s.trim();
            if (rawSubject.length === 0) return null;
            // Append (Sem X) only if not already present
            if (rawSubject.match(/\(Sem \d+\)$/)) return rawSubject;
            return `${rawSubject} (Sem ${semester})`;
        }).filter(s => s !== null);

        if (newSubjectsToAdd.length === 0) return;

        // Check duplicates
        const currentSubjects = teacher.assigned_subjects || [];
        // Filter out ones they already have (Checking full string including Sem)
        const uniqueNew = newSubjectsToAdd.filter(s => !currentSubjects.includes(s));

        if (uniqueNew.length === 0) {
            setInputs({ ...inputs, [teacherId]: '' }); // Clear if all duplicates
            return;
        }

        const updatedList = [...currentSubjects, ...uniqueNew];

        // Optimistic update
        updateTeacherLocal(teacherId, updatedList);
        setInputs({ ...inputs, [teacherId]: '' });
        setActionLoading(teacherId);

        try {
            await updateUserSubjects(teacherId, updatedList);
        } catch (error) {
            console.error("Failed to add subject", error);
            alert("Failed to add subject");
            // Revert
            updateTeacherLocal(teacherId, currentSubjects);
        } finally {
            setActionLoading(null);
        }
    };

    const updateTeacherLocal = (id: string, subjects: string[]) => {
        setTeachers(prev => prev.map(t => (t._id || t.id) === id ? { ...t, assigned_subjects: subjects } : t));
    };

    const filteredTeachers = teachers.filter(t =>
        t.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                    <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
                        <BookOpen className="w-8 h-8 mr-3 text-blue-600" />
                        Assign Subjects
                    </h1>

                    {/* Search */}
                    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                        <div className="relative">
                            <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search teachers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Teacher</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">Assigned Subjects</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Add New</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredTeachers.map(teacher => (
                                    <tr key={teacher._id || teacher.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{teacher.full_name}</div>
                                            <div className="text-sm text-gray-500">{teacher.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                {teacher.assigned_subjects?.map(subject => (
                                                    <span key={subject} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                                        {subject}
                                                        <button
                                                            onClick={() => handleRemoveSubject(teacher, subject)}
                                                            disabled={actionLoading === (teacher._id || teacher.id)}
                                                            className="ml-1.5 inline-flex items-center justify-center text-blue-400 hover:text-blue-600 focus:outline-none"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                                {(!teacher.assigned_subjects || teacher.assigned_subjects.length === 0) && (
                                                    <span className="text-red-500 text-sm italic">No subjects assigned (Inactive)</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex flex-col gap-2 w-full">
                                                    <div className="flex gap-2">
                                                        <select
                                                            className="rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-1 border"
                                                            value={inputs[`${teacher._id || teacher.id}_sem`] || '1'}
                                                            onChange={(e) => setInputs({ ...inputs, [`${teacher._id || teacher.id}_sem`]: e.target.value })}
                                                        >
                                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                                                        </select>
                                                        <input
                                                            type="text"
                                                            placeholder="Subject name..."
                                                            value={inputs[teacher._id || teacher.id] || ''}
                                                            onChange={(e) => setInputs({ ...inputs, [teacher._id || teacher.id]: e.target.value })}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleAddSubject(teacher);
                                                            }}
                                                            className="block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-1 border"
                                                        />
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleAddSubject(teacher)}
                                                        className="w-full"
                                                        disabled={!inputs[teacher._id || teacher.id] || actionLoading === (teacher._id || teacher.id)}
                                                    >
                                                        {actionLoading === (teacher._id || teacher.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-2" /> Assign Subject</>}
                                                    </Button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredTeachers.length === 0 && (
                            <div className="p-8 text-center text-gray-500">
                                No teachers found.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
